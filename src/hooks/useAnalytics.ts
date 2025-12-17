/**
 * Analytics Hook
 * Provides easy access to analytics tracking throughout the app
 */

import { AnalyticsService } from '@/services/AnalyticsService';
import { useEffect, useRef } from 'react';

let analyticsInstance: AnalyticsService | null = null;

export const useAnalytics = () => {
  const serviceRef = useRef<AnalyticsService | null>(null);

  useEffect(() => {
    if (!serviceRef.current) {
      // Create singleton instance
      if (!analyticsInstance) {
        analyticsInstance = new AnalyticsService();

        // Set user consent (you can integrate this with your privacy settings)
        analyticsInstance.setUserConsent(true);
      }
      serviceRef.current = analyticsInstance;
    }
  }, []);

  return {
    trackLike: (contentId: string, additionalData?: Record<string, any>) => {
      return serviceRef.current?.trackLikeEvent(contentId, additionalData);
    },

    trackSkip: (contentId: string, direction?: string, distance?: number) => {
      return serviceRef.current?.trackSkipEvent(contentId, direction, distance);
    },

    trackNavigation: (
      contentId: string,
      destinationLat: number,
      destinationLng: number
    ) => {
      return serviceRef.current?.trackNavigationEvent(
        contentId,
        destinationLat,
        destinationLng
      );
    },

    flush: () => {
      return serviceRef.current?.flush();
    },

    setUserConsent: (hasConsent: boolean) => {
      serviceRef.current?.setUserConsent(hasConsent);
    },
  };
};
