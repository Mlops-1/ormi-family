import type { RoutePoint } from '@/types/map';

/**
 * Calculate center point from route coordinates
 */
function calculateCenter(spots: RoutePoint[]): { lon: number; lat: number } {
  const lons = spots.map((s) => s.coordinates.lon);
  const lats = spots.map((s) => s.coordinates.lat);

  const centerLon = (Math.max(...lons) + Math.min(...lons)) / 2;
  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;

  return { lon: centerLon, lat: centerLat };
}

/**
 * Generate Tmap Static Map URL for course thumbnail
 * @param spots - Array of route points (start, waypoints, end)
 * @param width - Image width (default: 400)
 * @param height - Image height (default: 300)
 * @returns Static map image URL
 */
export function generateCourseStaticMapUrl(
  spots: RoutePoint[],
  width: number = 400,
  height: number = 300
): string {
  const APP_KEY = import.meta.env.VITE_TMAP_APP_KEY;

  if (!APP_KEY || spots.length < 2) {
    console.warn('Missing APP_KEY or insufficient spots for map generation');
    return '';
  }

  // Calculate center point
  const center = calculateCenter(spots);

  // Create markers for all spots
  const markerList: string[] = [];
  spots.forEach((spot) => {
    // Label(S, E, idx) removed due to API 500 error. Only lon,lat supported.
    markerList.push(`${spot.coordinates.lon},${spot.coordinates.lat}`);
  });

  // Build URL with MINIMAL required parameters
  const baseUrl = 'https://apis.openapi.sk.com/tmap/staticMap';
  // Try using only center and zoom first to isolate the issue
  const params = new URLSearchParams({
    version: '1',
    width: width.toString(),
    height: height.toString(),
    longitude: center.lon.toString(), // REQUIRED based on screenshot
    latitude: center.lat.toString(), // REQUIRED based on screenshot
    zoom: '10', // REQUIRED based on screenshot
    format: 'png',
    appKey: APP_KEY, // REQUIRED in Query Params (cannot use header for img src)
    markers: markerList.join('|'),
  });

  const url = `${baseUrl}?${params.toString()}`;

  console.log('🗺️ Static Map URL (Corrected):', url);
  console.log('📍 Center:', center);
  console.log('📌 Markers:', markerList);

  return url;
}
