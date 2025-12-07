interface Coordinates {
  lat: number;
  lon: number;
}

interface GeoLocationState {
  loaded: boolean;
  coordinates: Coordinates;
  error?: {
    code: number;
    message: string;
  };
  isFallback: boolean;
}

export type { Coordinates, GeoLocationState };
