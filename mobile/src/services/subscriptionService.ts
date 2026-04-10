import {
  createSubscription,
  getSubscriptionByUserId,
  subscribeToSubscriptionByUserId,
  updateSubscriptionByUserId,
} from '../repositories/subscriptionRepository';
import type {
  CreateUserSubscriptionInput,
  PlanLevel,
  PlanStatus,
  UserSubscription,
} from '../types/subscription';

export class SubscriptionValidationError extends Error {}

type AdminUpdatePlanInput = {
  adminRole: string | null | undefined;
  targetUserId: string;
  planLevel: PlanLevel;
  status: PlanStatus;
};

type PromotedEventAccessInput = {
  userRole: string | null | undefined;
  subscription: UserSubscription | null;
  activePromotedEventsCount: number;
};

type PromotedEventAccessState = {
  allowed: boolean;
  message: string;
  maxActivePromotedEvents: number;
  analyticsEnabled: boolean;
};

const PROMOTED_EVENT_LIMITS: Record<PlanLevel, number> = {
  free: 0,
  organization_basic: 1,
  organization_premium: 5,
};

export async function createDefaultSubscription(userId: string) {
  const subscription: CreateUserSubscriptionInput = {
    userId,
    planLevel: 'free',
    status: 'active',
  };

  await createSubscription(subscription);
}

export async function loadUserSubscription(userId: string) {
  if (!userId) {
    throw new SubscriptionValidationError(
      'You must be logged in to load subscription details.'
    );
  }

  return getSubscriptionByUserId(userId);
}

export function observeUserSubscription(
  userId: string | null | undefined,
  onSubscription: (subscription: UserSubscription) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onSubscription({
      userId: '',
      planLevel: 'free',
      status: 'inactive',
    });
    return () => {};
  }

  return subscribeToSubscriptionByUserId(userId, onSubscription, onError);
}

export function getPromotedEventAccessState(
  input: PromotedEventAccessInput
): PromotedEventAccessState {
  if (input.userRole !== 'organization') {
    return {
      allowed: false,
      message: 'Only organization accounts can create promoted events.',
      maxActivePromotedEvents: 0,
      analyticsEnabled: false,
    };
  }

  const subscription = input.subscription;
  const planLevel = subscription?.planLevel ?? 'free';
  const status = subscription?.status ?? 'inactive';
  const maxActivePromotedEvents = PROMOTED_EVENT_LIMITS[planLevel];
  const analyticsEnabled = planLevel === 'organization_premium';

  if (status === 'inactive') {
    return {
      allowed: false,
      message: 'Your plan is inactive. Ask an admin to reactivate it.',
      maxActivePromotedEvents,
      analyticsEnabled,
    };
  }

  if (planLevel === 'free') {
    return {
      allowed: false,
      message:
        'Promoted events require an organization_basic or organization_premium plan.',
      maxActivePromotedEvents,
      analyticsEnabled,
    };
  }

  if (input.activePromotedEventsCount >= maxActivePromotedEvents) {
    return {
      allowed: false,
      message: `Your current plan allows ${maxActivePromotedEvents} active promoted event${
        maxActivePromotedEvents === 1 ? '' : 's'
      }. Upgrade or close an active event to create another.`,
      maxActivePromotedEvents,
      analyticsEnabled,
    };
  }

  return {
    allowed: true,
    message:
      status === 'trial'
        ? 'Trial access is active for promoted events.'
        : 'Your plan allows promoted event creation.',
    maxActivePromotedEvents,
    analyticsEnabled,
  };
}

export async function updateUserPlan(input: AdminUpdatePlanInput) {
  if (input.adminRole !== 'admin') {
    throw new SubscriptionValidationError('Admin access is required.');
  }

  const targetUserId = input.targetUserId.trim();
  if (!targetUserId) {
    throw new SubscriptionValidationError('Target user id is required.');
  }

  await updateSubscriptionByUserId(targetUserId, {
    planLevel: input.planLevel,
    status: input.status,
  });
}
