import { hideCommentById, hidePostById } from '../repositories/moderationRepository';
import {
  subscribeToReports,
  updateReportStatus,
} from '../repositories/reportRepository';
import type { ModerationReport, ReportStatus } from '../types/report';

export class ModerationValidationError extends Error {}

function ensureAdmin(role: string | null | undefined) {
  if (role !== 'admin') {
    throw new ModerationValidationError('Admin access is required.');
  }
}

export function observeReports(
  role: string | null | undefined,
  onReports: (reports: ModerationReport[]) => void,
  onError?: (error: Error) => void
) {
  if (role !== 'admin') {
    onReports([]);
    return () => undefined;
  }

  return subscribeToReports(onReports, onError);
}

export async function reviewReportStatus(input: {
  role: string | null | undefined;
  reportId: string;
  status: ReportStatus;
}) {
  ensureAdmin(input.role);
  await updateReportStatus(input.reportId, input.status);
}

export async function hideReportedTarget(input: {
  role: string | null | undefined;
  report: ModerationReport;
}) {
  ensureAdmin(input.role);

  if (input.report.targetType === 'post') {
    await hidePostById(input.report.targetId);
    await updateReportStatus(input.report.id, 'action_taken');
    return;
  }

  if (!input.report.targetPostId) {
    throw new ModerationValidationError(
      'Comment reports require the parent post id for moderation actions.'
    );
  }

  await hideCommentById(input.report.targetPostId, input.report.targetId);
  await updateReportStatus(input.report.id, 'action_taken');
}
