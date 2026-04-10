import { loadAdminAnalyticsSnapshot } from '../repositories/analyticsRepository';

export class AnalyticsValidationError extends Error {}

export async function getAdminAnalytics(adminRole: string | null | undefined) {
  if (adminRole !== 'admin') {
    throw new AnalyticsValidationError('Admin access is required.');
  }

  return loadAdminAnalyticsSnapshot();
}
