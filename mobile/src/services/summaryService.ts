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

export async function summarizeAreaPosts(
  request: SummarizeAreaRequest
): Promise<string> {
  try {
    const result = await summarizeAreaCallable(request);
    return result.data.summary;
  } catch (error) {
    throw toSummaryError(error);
  }
}
