export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeoLocationState {
  loaded: boolean;
  coordinates: Coordinates;
  error?: {
    code: number;
    message: string;
  };
  isFallback: boolean;
}
