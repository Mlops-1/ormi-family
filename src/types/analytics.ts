/**
 * Analytics Event Types and Interfaces
 */

export type EventType = 'LIKE' | 'SKIP' | 'NAVIGATION';

export interface AnalyticsEvent {
  timestamp: string; // ISO 8601 format
  eventType: EventType;
  contentTypeId: string;
  userId: string; // User ID (e.g., "1")
  latitude?: number;
  longitude?: number;
  weather?: string;
  additionalData?: {
    direction?: string; // for SKIP events
    distance?: number; // for SKIP events
    destinationLat?: number; // for NAVIGATION events
    destinationLng?: number; // for NAVIGATION events
    distanceToDestination?: number; // for NAVIGATION events
  };
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface WeatherData {
  condition: string; // sunny, cloudy, rainy, etc.
  temperature: number;
  humidity: number;
  timestamp: number;
  cacheExpiry: number;
}

export interface AnalyticsConfig {
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  s3BucketName: string;
  kinesisStreamName: string;
  weatherApiKey: string;
  enableLocationTracking: boolean;
  enableWeatherTracking: boolean;
}
