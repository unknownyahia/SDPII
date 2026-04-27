export type LeaderboardEntry = {
  userId: string;
  rank: number;
  displayName: string;
  xp: number;
  role: string;
  badgeCount: number;
  isCurrentUser: boolean;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
};
