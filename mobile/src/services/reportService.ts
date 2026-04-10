import { createOrUpdateReport } from '../repositories/reportRepository';
import type {
  CreateModerationReportInput,
  ReportReason,
  ReportTargetType,
} from '../types/report';

export class ReportValidationError extends Error {}

type SubmitReportInput = {
  reporterUserId: string | null | undefined;
  targetType: ReportTargetType;
  targetId: string;
  targetPostId?: string | null;
  reason: ReportReason;
  note?: string;
};

function normalizeNote(note: string | undefined) {
  return (note ?? '').trim();
}

export async function submitReport(input: SubmitReportInput) {
  if (!input.reporterUserId) {
    throw new ReportValidationError('You must be logged in to submit a report.');
  }

  if (!input.targetId) {
    throw new ReportValidationError('A valid report target is required.');
  }

  const report: CreateModerationReportInput = {
    reporterUserId: input.reporterUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    targetPostId: input.targetPostId ?? null,
    reason: input.reason,
    note: normalizeNote(input.note),
    status: 'open',
  };

  return createOrUpdateReport(report);
}
