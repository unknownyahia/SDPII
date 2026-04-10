import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebase';
import type { SpotCategory } from '../types/post';
import type { UserSubscription } from '../types/subscription';
import {
  getCurrentCoordinates,
  getLocationDisplayName,
  requestForegroundLocationPermission,
} from './locationService';
import { getPromotedEventAccessState } from './subscriptionService';

export class EventValidationError extends Error {}
export class EventPermissionError extends Error {}

type CreatePromotedEventRequest = {
  title: string;
  description: string;
  category: SpotCategory;
  locationName: string | null;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
};

const createPromotedEventCallable = httpsCallable<
  CreatePromotedEventRequest,
  { eventId: string }
>(functions, 'createPromotedEvent');

type CreateEventInput = {
  userId: string | null | undefined;
  userRole: string | null | undefined;
  subscription: UserSubscription | null;
  title: string;
  description: string;
  category: SpotCategory;
  startTime: string;
  endTime: string;
};

type CreateEventResult = {
  locationName: string;
};

function parseDateString(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createPromotedEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  if (!input.userId) {
    throw new EventValidationError('You must be logged in to create an event.');
  }

  if (input.userRole !== 'organization') {
    throw new EventValidationError(
      'Only organization accounts can create promoted events.'
    );
  }

  const accessState = getPromotedEventAccessState({
    userRole: input.userRole,
    subscription: input.subscription,
    activePromotedEventsCount: 0,
  });

  if (!accessState.allowed) {
    throw new EventValidationError(accessState.message);
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const startDate = parseDateString(input.startTime.trim());
  const endDate = parseDateString(input.endTime.trim());

  if (!title || !description) {
    throw new EventValidationError('Title and description are required.');
  }

  if (!startDate || !endDate) {
    throw new EventValidationError('Start and end times must be valid dates.');
  }

  if (endDate <= startDate) {
    throw new EventValidationError('End time must be later than start time.');
  }

  const { status } = await requestForegroundLocationPermission();
  if (status !== 'granted') {
    throw new EventPermissionError(
      'We need location permission to place the event on the map.'
    );
  }

  const { latitude, longitude } = await getCurrentCoordinates();
  const locationName = await getLocationDisplayName(latitude, longitude);

  await createPromotedEventCallable({
    title,
    description,
    category: input.category,
    locationName: locationName || null,
    lat: latitude,
    lng: longitude,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  });

  return {
    locationName,
  };
}
