import type { GeoLocationState } from '@/types/geo';
import { useEffect, useState } from 'react';

export default function useGeoLocation() {
  const [location, setLocation] = useState<GeoLocationState>({
    loaded: false,
    coordinates: { lat: 33.4996, lon: 126.5312 }, // Default: Jeju City
    isFallback: false,
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocation((prev) => ({
        ...prev,
        loaded: true,
        isFallback: true,
        error: { code: 0, message: 'Geolocation not supported' },
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          loaded: true,
          coordinates: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          isFallback: false,
        });
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          loaded: true,
          isFallback: true,
          error: { code: error.code, message: error.message },
        }));
      }
    );
  }, []);

  return location;
}
