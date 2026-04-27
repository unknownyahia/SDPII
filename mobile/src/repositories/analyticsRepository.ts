import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { INTERNAL_SPOT_CATEGORIES, isSpotCategory } from '../constants/categories';
import type {
  AdminAnalyticsSnapshot,
  CategoryCount,
  ReportStatusCount,
} from '../types/analytics';
import type { SpotCategory } from '../types/post';
import type { ReportStatus } from '../types/report';

const USERS_COLLECTION = 'users';
const POSTS_COLLECTION = 'posts';
const EVENTS_COLLECTION = 'events';
const REPORTS_COLLECTION = 'reports';
const COMMENTS_COLLECTION = 'comments';
const REACTIONS_COLLECTION = 'reactions';
const NOTIFICATIONS_COLLECTION = 'notifications';

const REPORT_STATUSES: ReportStatus[] = [
  'open',
  'reviewed',
  'dismissed',
  'action_taken',
];

function createCategoryCounts(): Record<SpotCategory, number> {
  return Object.fromEntries(
    INTERNAL_SPOT_CATEGORIES.map((category) => [category, 0])
  ) as Record<SpotCategory, number>;
}

function createReportStatusCounts(): Record<ReportStatus, number> {
  return {
    open: 0,
    reviewed: 0,
    dismissed: 0,
    action_taken: 0,
  };
}

function mapCategoryCounts(
  counts: Record<SpotCategory, number>
): CategoryCount[] {
  return INTERNAL_SPOT_CATEGORIES.map((category) => ({
    category,
    count: counts[category],
  }));
}

function mapReportStatusCounts(
  counts: Record<ReportStatus, number>
): ReportStatusCount[] {
  return REPORT_STATUSES.map((status) => ({
    status,
    count: counts[status],
  }));
}

export async function loadAdminAnalyticsSnapshot(): Promise<AdminAnalyticsSnapshot> {
  const [
    usersSnapshot,
    organizationUsersSnapshot,
    postsSnapshot,
    promotedEventsSnapshot,
    reportsSnapshot,
    commentsSnapshot,
    likesSnapshot,
    notificationsSnapshot,
  ] = await Promise.all([
    getDocs(collection(db, USERS_COLLECTION)),
    getDocs(
      query(collection(db, USERS_COLLECTION), where('role', '==', 'organization'))
    ),
    getDocs(collection(db, POSTS_COLLECTION)),
    getDocs(
      query(collection(db, EVENTS_COLLECTION), where('isPromoted', '==', true))
    ),
    getDocs(collection(db, REPORTS_COLLECTION)),
    getDocs(collectionGroup(db, COMMENTS_COLLECTION)),
    getDocs(collectionGroup(db, REACTIONS_COLLECTION)),
    getDocs(collectionGroup(db, NOTIFICATIONS_COLLECTION)),
  ]);

  const postCategoryCounts = createCategoryCounts();
  postsSnapshot.forEach((docSnap) => {
    const category = docSnap.data().category;
    if (isSpotCategory(category)) {
      postCategoryCounts[category] += 1;
    }
  });

  const eventCategoryCounts = createCategoryCounts();
  promotedEventsSnapshot.forEach((docSnap) => {
    const category = docSnap.data().category;
    if (isSpotCategory(category)) {
      eventCategoryCounts[category] += 1;
    }
  });

  const reportStatusCounts = createReportStatusCounts();
  reportsSnapshot.forEach((docSnap) => {
    const status = docSnap.data().status;
    if (typeof status === 'string' && status in reportStatusCounts) {
      reportStatusCounts[status as ReportStatus] += 1;
      return;
    }

    reportStatusCounts.open += 1;
  });

  return {
    totalUsers: usersSnapshot.size,
    totalPosts: postsSnapshot.size,
    totalPromotedEvents: promotedEventsSnapshot.size,
    totalReports: reportsSnapshot.size,
    totalComments: commentsSnapshot.size,
    totalLikes: likesSnapshot.size,
    totalNotifications: notificationsSnapshot.size,
    totalOrganizationAccounts: organizationUsersSnapshot.size,
    postsByCategory: mapCategoryCounts(postCategoryCounts),
    eventsByCategory: mapCategoryCounts(eventCategoryCounts),
    reportsByStatus: mapReportStatusCounts(reportStatusCounts),
  };
}
