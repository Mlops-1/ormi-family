/**
 * Analytics Event Validation and Sanitization
 */

import type { AnalyticsEvent, EventType } from '@/types/analytics';

export const validateEventType = (
  eventType: string
): eventType is EventType => {
  return ['LIKE', 'SKIP', 'NAVIGATION'].includes(eventType);
};

export const validateCoordinates = (lat?: number, lng?: number): boolean => {
  if (lat === undefined || lng === undefined) return true; // Optional fields
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const sanitizeString = (input: string): string => {
  return input.replace(/[^\w\s-_.]/g, '').trim();
};

export const validateAnalyticsEvent = (
  event: Partial<AnalyticsEvent>
): string[] => {
  const errors: string[] = [];

  if (!event.timestamp) {
    errors.push('Timestamp is required');
  } else {
    try {
      new Date(event.timestamp);
    } catch {
      errors.push('Invalid timestamp format');
    }
  }

  if (!event.eventType) {
    errors.push('Event type is required');
  } else if (!validateEventType(event.eventType)) {
    errors.push('Invalid event type');
  }

  if (!event.contentTypeId) {
    errors.push('Content type ID is required');
  }

  if (!event.userId) {
    errors.push('User ID is required');
  }

  if (!validateCoordinates(event.latitude, event.longitude)) {
    errors.push('Invalid coordinates');
  }

  return errors;
};

export const sanitizeAnalyticsEvent = (
  event: AnalyticsEvent
): AnalyticsEvent => {
  return {
    ...event,
    contentTypeId: sanitizeString(event.contentTypeId),
    userId: sanitizeString(event.userId),
    weather: event.weather ? sanitizeString(event.weather) : undefined,
    additionalData: event.additionalData
      ? {
          ...event.additionalData,
          direction: event.additionalData.direction
            ? sanitizeString(event.additionalData.direction)
            : undefined,
        }
      : undefined,
  };
};
