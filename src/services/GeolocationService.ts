/**
 * Geolocation Service
 * Handles user location tracking with permission management
 */

import type { GeolocationData } from '@/types/analytics';

export class GeolocationService {
  private lastKnownPosition: GeolocationData | null = null;
  private positionCache: Map<string, GeolocationData> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current user position
   */
  async getCurrentPosition(): Promise<GeolocationData | null> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Check permission first
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return null;
        }
      }

      // Get position with timeout
      const position = await this.getPositionWithTimeout(10000);

      const locationData: GeolocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };

      this.lastKnownPosition = locationData;
      this.cachePosition(locationData);

      return locationData;
    } catch (error) {
      console.warn('Failed to get current position:', error);

      // Return cached position if available and recent
      const cached = this.getCachedPosition();
      if (cached) {
        return cached;
      }

      return this.lastKnownPosition;
    }
  }

  /**
   * Check if user has granted location permission
   */
  async hasPermission(): Promise<boolean> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({
          name: 'geolocation',
        });
        return permission.state === 'granted';
      }

      // Fallback: try to get position to check permission
      return true; // Assume permission exists, will be checked during actual request
    } catch (error) {
      console.warn('Failed to check geolocation permission:', error);
      return false;
    }
  }

  /**
   * Request location permission from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      // The permission is requested when we call getCurrentPosition
      // This is a placeholder that could show a custom UI
      return true;
    } catch (error) {
      console.warn('Failed to request geolocation permission:', error);
      return false;
    }
  }

  /**
   * Get position with timeout
   */
  private getPositionWithTimeout(
    timeout: number
  ): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 60000, // Accept cached position up to 1 minute old
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Cache position data
   */
  private cachePosition(position: GeolocationData): void {
    const key = `${Math.round(position.latitude * 1000)}_${Math.round(position.longitude * 1000)}`;
    this.positionCache.set(key, position);

    // Clean old cache entries
    setTimeout(() => {
      this.positionCache.delete(key);
    }, this.CACHE_DURATION);
  }

  /**
   * Get cached position if available and recent
   */
  private getCachedPosition(): GeolocationData | null {
    const now = Date.now();

    for (const [, position] of this.positionCache) {
      if (now - position.timestamp < this.CACHE_DURATION) {
        return position;
      }
    }

    return null;
  }
}
