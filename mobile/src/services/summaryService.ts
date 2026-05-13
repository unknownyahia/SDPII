import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebase';
import type {
  SummarizeAreaRequest,
  SummarizeAreaResponse,
} from '../types/summary';

const summarizeAreaCallable = httpsCallable<
  SummarizeAreaRequest,
  SummarizeAreaResponse
>(functions, 'summarizeArea');

const FALLBACK_CATEGORY_LABELS: Record<string, string> = {
  event: 'events',
  fishing: 'fishing',
  sighting: 'local sightings',
  weather: 'outdoor conditions',
};
const MAX_SUMMARY_ITEM_TEXT_LENGTH = 280;

function getCallableCode(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code.toLowerCase()
    : '';
}

function getCallableMessage(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
}

function toSummaryError(error: unknown) {
  const code = getCallableCode(error);
  const message = getCallableMessage(error).toLowerCase();

  if (code.includes('not-found')) {
    return new Error('Area summary is not deployed in this Firebase project yet.');
  }

  if (code.includes('failed-precondition') || message.includes('openai configuration')) {
    return new Error('Area summary needs OpenAI configuration before it can run.');
  }

  if (code.includes('resource-exhausted') || message.includes('quota')) {
    return new Error(
      'Area summary is temporarily unavailable because the AI service quota is exhausted.'
    );
  }

  if (code.includes('internal') && message.includes('failed to generate summary')) {
    return new Error(
      'Area summary backend failed to generate a response. Check the Cloud Function logs and OpenAI configuration.'
    );
  }

  return error;
}

function normalizeSummaryText(value?: string | null) {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function getSummaryItemText(post: SummarizeAreaRequest['posts'][number]) {
  const title = normalizeSummaryText(post.title);
  const text = normalizeSummaryText(post.text);

  if (!title) {
    return text.slice(0, MAX_SUMMARY_ITEM_TEXT_LENGTH);
  }

  if (!text) {
    return title.slice(0, MAX_SUMMARY_ITEM_TEXT_LENGTH);
  }

  const startsWithTitle = text.toLocaleLowerCase().startsWith(title.toLocaleLowerCase());
  const combined = startsWithTitle ? text : `${title}: ${text}`;
  return combined.slice(0, MAX_SUMMARY_ITEM_TEXT_LENGTH);
}

function buildCallableSummaryRequest(request: SummarizeAreaRequest): SummarizeAreaRequest {
  return {
    posts: request.posts
      .map(post => ({
        ...post,
        title: normalizeSummaryText(post.title) || null,
        text: getSummaryItemText(post),
      }))
      .filter(post => post.text.length > 0),
  };
}

function buildFallbackSummary(request: SummarizeAreaRequest) {
  const posts = buildCallableSummaryRequest(request).posts.slice(0, 20);

  if (posts.length === 0) {
    return 'There are not enough visible updates to summarize yet.';
  }

  const categoryCounts = new Map<string, number>();
  const sampleTexts: string[] = [];

  posts.forEach(post => {
    const category = post.category ?? 'general';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);

    if (sampleTexts.length < 2) {
      sampleTexts.push(normalizeSummaryText(post.text).replace(/[.!?]+$/, ''));
    }
  });

  const categories = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([category]) => FALLBACK_CATEGORY_LABELS[category] ?? 'local updates');
  const categoryPhrase = categories.length > 0 ? categories.join(', ') : 'local updates';
  const samplePhrase =
    sampleTexts.length > 0
      ? ` Notable signals mention ${sampleTexts.join('; ')}.`
      : '';

  return `This view has ${posts.length} visible update${
    posts.length === 1 ? '' : 's'
  }, mainly around ${categoryPhrase}.${samplePhrase} Check the top cards and map markers for the freshest nearby context before you go.`;
}

export async function summarizeAreaPosts(
  request: SummarizeAreaRequest
): Promise<string> {
  const callableRequest = buildCallableSummaryRequest(request);

  try {
    const result = await summarizeAreaCallable(callableRequest);
    return result.data.summary?.trim() || buildFallbackSummary(callableRequest);
  } catch (error) {
    const summaryError = toSummaryError(error);
    const fallbackSummary = buildFallbackSummary(callableRequest);

    if (fallbackSummary) {
      return fallbackSummary;
    }

    throw summaryError;
  }
}
