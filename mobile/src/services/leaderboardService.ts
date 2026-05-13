import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebase';
import type { LeaderboardResponse } from '../types/leaderboard';

const getLeaderboardCallable = httpsCallable<
  { limit: number },
  LeaderboardResponse
>(functions, 'getLeaderboard');

export async function loadLeaderboard(limit = 10) {
  try {
    const result = await getLeaderboardCallable({ limit });
    return Array.isArray(result.data.entries) ? result.data.entries : [];
  } catch {
    return [];
  }
}
