export type PlanLevel =
  | 'free'
  | 'organization_basic'
  | 'organization_premium';

export type PlanStatus = 'active' | 'inactive' | 'trial';

export type UserSubscription = {
  userId: string;
  planLevel: PlanLevel;
  status: PlanStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateUserSubscriptionInput = Omit<
  UserSubscription,
  'createdAt' | 'updatedAt'
>;
