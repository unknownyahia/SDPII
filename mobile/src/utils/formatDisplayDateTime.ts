import type { AppLanguage } from '../types/profile';

function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  if (typeof value === 'object') {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }

    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000;
    }
  }

  return null;
}

function getLocale(language: AppLanguage) {
  return language === 'ar' ? 'ar-QA' : 'en-US';
}

export function formatDisplayDateTime(
  value: unknown,
  language: AppLanguage,
  nowMs = Date.now()
) {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return null;
  }

  const parsed = new Date(timestampMs);
  const current = new Date(nowMs);
  const parsedDay = Date.UTC(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
  const currentDay = Date.UTC(
    current.getFullYear(),
    current.getMonth(),
    current.getDate()
  );
  const dayDelta = Math.abs(parsedDay - currentDay) / (24 * 60 * 60 * 1000);

  let options: Intl.DateTimeFormatOptions;

  if (dayDelta === 0) {
    options = {
      hour: 'numeric',
      minute: '2-digit',
    };
  } else if (dayDelta <= 6) {
    options = {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    };
  } else if (parsed.getFullYear() === current.getFullYear()) {
    options = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
  } else {
    options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
  }

  return new Intl.DateTimeFormat(getLocale(language), options).format(parsed);
}
