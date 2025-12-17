/**
 * Analytics Service
 * Handles user behavior event tracking and transmission to AWS S3
 */

import { analyticsConfig, validateConfig } from '@/config/analytics';
import { TEMP_USER_ID } from '@/constants/temp_user';
import type { AnalyticsEvent, EventType } from '@/types/analytics';
import {
  sanitizeAnalyticsEvent,
  validateAnalyticsEvent,
} from '@/utils/analytics-validation';
import { EventBuffer } from './EventBuffer';
import { GeolocationService } from './GeolocationService';
import { KinesisClient } from './KinesisClient';
import { WeatherService } from './WeatherService';

export class AnalyticsService {
  private geolocationService: GeolocationService;
  private weatherService: WeatherService;
  private kinesisClient: KinesisClient;
  private eventBuffer: EventBuffer;
  private userConsent: boolean = false;

  constructor() {
    if (!validateConfig()) {
      console.warn(
        'Analytics configuration is incomplete. Some features may not work.'
      );
    }

    this.geolocationService = new GeolocationService();
    this.weatherService = new WeatherService(analyticsConfig.weatherApiKey);
    this.kinesisClient = new KinesisClient(analyticsConfig);
    this.eventBuffer = new EventBuffer();
  }

  /**
   * Set user consent for location tracking
   */
  setUserConsent(hasConsent: boolean): void {
    this.userConsent = hasConsent;
  }

  /**
   * Track like event when user swipes/drags to like content
   */
  async trackLikeEvent(
    contentId: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent('LIKE', contentId, additionalData);
  }

  /**
   * Track skip event when user swipes/drags to skip content
   */
  async trackSkipEvent(
    contentId: string,
    direction?: string,
    distance?: number
  ): Promise<void> {
    const additionalData = { direction, distance };
    await this.trackEvent('SKIP', contentId, additionalData);
  }

  /**
   * Track navigation event when user clicks navigation button
   */
  async trackNavigationEvent(
    contentId: string,
    destinationLat: number,
    destinationLng: number
  ): Promise<void> {
    const userLocation = await this.getUserLocation();
    const distanceToDestination = userLocation
      ? this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          destinationLat,
          destinationLng
        )
      : undefined;

    const additionalData = {
      destinationLat,
      destinationLng,
      distanceToDestination,
    };

    await this.trackEvent('NAVIGATION', contentId, additionalData);
  }

  /**
   * Core event tracking method
   */
  private async trackEvent(
    eventType: EventType,
    contentId: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get current user ID from auth context
      const userId = TEMP_USER_ID.toString();

      // Get location if user has consented
      const location = await this.getUserLocation();

      // Get weather if location is available
      const weather = location
        ? await this.getWeatherData(location.latitude, location.longitude)
        : undefined;

      // Create analytics event
      const event: AnalyticsEvent = {
        timestamp: new Date().toISOString(),
        eventType,
        contentTypeId: contentId,
        userId,
        latitude: location?.latitude,
        longitude: location?.longitude,
        weather: weather?.condition,
        additionalData,
      };

      // Validate event
      const validationErrors = validateAnalyticsEvent(event);
      if (validationErrors.length > 0) {
        console.error('Analytics event validation failed:', validationErrors);
        return;
      }

      // Sanitize event
      const sanitizedEvent = sanitizeAnalyticsEvent(event);

      // Try to send immediately, fallback to buffer if failed
      try {
        await this.kinesisClient.putRecord(sanitizedEvent);
      } catch (error) {
        console.warn(
          'Failed to send analytics event immediately, buffering for retry:',
          error
        );
        this.eventBuffer.addEvent(sanitizedEvent);
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Get user location if consent is given
   */
  private async getUserLocation() {
    if (!this.userConsent || !analyticsConfig.enableLocationTracking) {
      return null;
    }

    try {
      return await this.geolocationService.getCurrentPosition();
    } catch (error) {
      console.warn('Failed to get user location:', error);
      return null;
    }
  }

  /**
   * Get weather data for given coordinates
   */
  private async getWeatherData(lat: number, lng: number) {
    if (!analyticsConfig.enableWeatherTracking) {
      return null;
    }

    try {
      return await this.weatherService.getCurrentWeather(lat, lng);
    } catch (error) {
      console.warn('Failed to get weather data:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Flush any buffered events
   */
  async flush(): Promise<void> {
    await this.eventBuffer.retryFailedEvents();
  }
}
