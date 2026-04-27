import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebase';
import type { LeaderboardResponse } from '../types/leaderboard';

const getLeaderboardCallable = httpsCallable<
  { limit: number },
  LeaderboardResponse
>(functions, 'getLeaderboard');

function getCallableCode(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code.toLowerCase()
    : '';
}

export async function loadLeaderboard(limit = 10) {
  try {
    const result = await getLeaderboardCallable({ limit });
    return result.data.entries;
  } catch (error) {
    if (getCallableCode(error).includes('not-found')) {
      throw new Error('Leaderboard is not deployed in this Firebase project yet.');
    }

    throw error;
  }
}
