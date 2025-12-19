import axios from 'axios';

const TMAP_APP_KEY = import.meta.env.VITE_TMAP_APP_KEY;

export interface RouteRequest {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  passList?: string; // "lon,lat_lon,lat..."
}

export interface RouteResponse {
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point' | 'LineString';
      coordinates: [number, number] | [number, number][];
    };
    properties: {
      totalDistance?: number;
      totalTime?: number;
      pointType?: string;
      index?: number;
      name?: string;
      description?: string;
    };
  }>;
}

export const fetchRoute = async (
  params: RouteRequest
): Promise<RouteResponse> => {
  if (!TMAP_APP_KEY) throw new Error('Tmap App Key is missing');

  const response = await axios.post<RouteResponse>(
    `https://apis.openapi.sk.com/tmap/routes?version=1&format=json&appKey=${TMAP_APP_KEY}`,
    {
      ...params,
      reqCoordType: 'WGS84GEO',
      resCoordType: 'WGS84GEO',
      searchOption: '0', // 0: Recommended
      trafficInfo: 'Y',
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
