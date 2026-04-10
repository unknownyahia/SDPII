import type { SpotCategory } from './post';
import type { ReportStatus } from './report';

export type CategoryCount = {
  category: SpotCategory;
  count: number;
};

export type ReportStatusCount = {
  status: ReportStatus;
  count: number;
};

export type AdminAnalyticsSnapshot = {
  totalUsers: number;
  totalPosts: number;
  totalPromotedEvents: number;
  totalReports: number;
  totalComments: number;
  totalLikes: number;
  totalNotifications: number;
  totalOrganizationAccounts: number;
  postsByCategory: CategoryCount[];
  eventsByCategory: CategoryCount[];
  reportsByStatus: ReportStatusCount[];
};
