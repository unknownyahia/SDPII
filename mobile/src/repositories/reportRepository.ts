import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type {
  CreateModerationReportInput,
  ModerationReport,
  ReportStatus,
} from '../types/report';

const REPORTS_COLLECTION = 'reports';

function buildReportDocumentId(input: CreateModerationReportInput) {
  return [
    input.reporterUserId,
    input.targetType,
    input.targetId,
    input.reason,
  ].join('_');
}

export async function createOrUpdateReport(input: CreateModerationReportInput) {
  const reportId = buildReportDocumentId(input);

  await setDoc(doc(db, REPORTS_COLLECTION, reportId), {
    ...input,
    note: input.note ?? '',
    createdAt: serverTimestamp(),
  });

  return reportId;
}

function mapReportDocument(
  docSnap: QueryDocumentSnapshot<DocumentData>
): ModerationReport {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    reporterUserId:
      typeof data.reporterUserId === 'string' ? data.reporterUserId : '',
    targetType: data.targetType === 'comment' ? 'comment' : 'post',
    targetId: typeof data.targetId === 'string' ? data.targetId : '',
    targetPostId:
      typeof data.targetPostId === 'string' ? data.targetPostId : null,
    reason:
      data.reason === 'spam' ||
      data.reason === 'misleading' ||
      data.reason === 'offensive' ||
      data.reason === 'unsafe' ||
      data.reason === 'other'
        ? data.reason
        : 'other',
    note: typeof data.note === 'string' ? data.note : '',
    status:
      data.status === 'reviewed' ||
      data.status === 'dismissed' ||
      data.status === 'action_taken'
        ? data.status
        : 'open',
    createdAt: data.createdAt,
  };
}

export function subscribeToReports(
  onReports: (reports: ModerationReport[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onReports(snapshot.docs.map(mapReportDocument));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
) {
  return setDoc(
    doc(db, REPORTS_COLLECTION, reportId),
    {
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
