/**
 * Event Buffer
 * Handles local storage and retry logic for failed analytics events
 */

import { analyticsConfig } from '@/config/analytics';
import type { AnalyticsEvent } from '@/types/analytics';
import { KinesisClient } from './KinesisClient';

export class EventBuffer {
  private readonly STORAGE_KEY = 'analytics_event_buffer';
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryInProgress = false;

  /**
   * Add event to local buffer
   */
  addEvent(event: AnalyticsEvent): void {
    try {
      const bufferedEvents = this.getEvents();

      // Add retry metadata
      const eventWithRetry = {
        ...event,
        _retryCount: 0,
        _bufferedAt: Date.now(),
      };

      bufferedEvents.push(eventWithRetry);

      // Limit buffer size
      if (bufferedEvents.length > this.MAX_BUFFER_SIZE) {
        bufferedEvents.shift(); // Remove oldest event
      }

      this.saveEvents(bufferedEvents);
      console.log(
        `Event buffered locally. Buffer size: ${bufferedEvents.length}`
      );
    } catch (error) {
      console.error('Failed to buffer event:', error);
    }
  }

  /**
   * Get all buffered events
   */
  getEvents(): (AnalyticsEvent & {
    _retryCount?: number;
    _bufferedAt?: number;
  })[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve buffered events:', error);
      return [];
    }
  }

  /**
   * Clear all buffered events
   */
  clearEvents(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Event buffer cleared');
    } catch (error) {
      console.error('Failed to clear event buffer:', error);
    }
  }

  /**
   * Retry failed events with exponential backoff
   */
  async retryFailedEvents(): Promise<void> {
    if (this.retryInProgress) {
      return;
    }

    this.retryInProgress = true;

    try {
      const bufferedEvents = this.getEvents();

      if (bufferedEvents.length === 0) {
        return;
      }

      console.log(`Retrying ${bufferedEvents.length} buffered events`);

      const kinesisClient = new KinesisClient(analyticsConfig);

      const successfulEvents: number[] = [];
      const failedEvents: (AnalyticsEvent & {
        _retryCount?: number;
        _bufferedAt?: number;
      })[] = [];

      for (let i = 0; i < bufferedEvents.length; i++) {
        const event = bufferedEvents[i];
        const retryCount = event._retryCount || 0;

        if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
          console.warn(`Event exceeded max retry attempts, discarding:`, event);
          continue;
        }

        try {
          // Remove retry metadata before sending
          const { _retryCount, _bufferedAt, ...cleanEvent } = event;
          await kinesisClient.putRecord(cleanEvent as AnalyticsEvent);
          successfulEvents.push(i);
          console.log(`Successfully retried buffered event`);
        } catch (error) {
          console.warn(
            `Retry attempt ${retryCount + 1} failed for event:`,
            error
          );

          // Add exponential backoff delay
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          await this.delay(delay);

          failedEvents.push({
            ...event,
            _retryCount: retryCount + 1,
          });
        }
      }

      // Update buffer with only failed events
      this.saveEvents(failedEvents);

      console.log(
        `Retry completed. Success: ${successfulEvents.length}, Failed: ${failedEvents.length}`
      );
    } catch (error) {
      console.error('Error during event retry:', error);
    } finally {
      this.retryInProgress = false;
    }
  }

  /**
   * Save events to local storage
   */
  private saveEvents(
    events: (AnalyticsEvent & { _retryCount?: number; _bufferedAt?: number })[]
  ): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events to buffer:', error);
    }
  }

  /**
   * Delay utility for exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): { count: number; oldestEvent?: number } {
    const events = this.getEvents();
    const oldestEvent =
      events.length > 0
        ? Math.min(...events.map((e) => e._bufferedAt || Date.now()))
        : undefined;

    return {
      count: events.length,
      oldestEvent,
    };
  }
}
