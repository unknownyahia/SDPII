export type ReportTargetType = 'post' | 'comment';

export type ReportReason =
  | 'spam'
  | 'misleading'
  | 'offensive'
  | 'unsafe'
  | 'other';

export type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'action_taken';

export type ModerationReport = {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetPostId?: string | null;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  createdAt?: unknown;
};

export type CreateModerationReportInput = Omit<
  ModerationReport,
  'id' | 'createdAt'
>;
