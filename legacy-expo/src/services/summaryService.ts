import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebaseConfig';
import type { SummarizeAreaRequest, SummarizeAreaResponse } from '../types/summary';

const summarizeAreaCallable = httpsCallable<
  SummarizeAreaRequest,
  SummarizeAreaResponse
>(functions, 'summarizeArea');

export async function summarizeAreaPosts(
  request: SummarizeAreaRequest
): Promise<string> {
  const result = await summarizeAreaCallable(request);
  return result.data.summary;
}
