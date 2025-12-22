import useTmapScript from '@/hooks/useTmapScript';
import type { RoutePoint } from '@/types/map';
import { useEffect, useRef } from 'react';

interface Props {
  spots: RoutePoint[];
  path?: { lat: number; lon: number }[]; // Actual route path
  width?: string | number;
  height?: string | number;
}

export default function CourseThumbnailMap({
  spots,
  path: routePath, // Rename prop to avoid conflict
  width = '100%',
  height = '100%',
}: Props) {
  const { isLoaded } = useTmapScript();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.Tmapv2 || spots.length === 0)
      return;

    // Destroy existing map if any
    if (mapRef.current.firstChild) {
      mapRef.current.innerHTML = '';
    }

    // 1. Initialize Map
    const map = new window.Tmapv2.Map(mapRef.current, {
      center: new window.Tmapv2.LatLng(
        spots[0].coordinates.lat,
        spots[0].coordinates.lon
      ),
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      zoom: 10,
      zoomControl: false,
      scrollwheel: false,
      draggable: false, // Disable interaction
    });

    mapInstance.current = map;

    // 2. Add Markers & Prepare Bounds
    const bounds = new window.Tmapv2.LatLngBounds();

    // Calculate bounds based on ALL points (spots + path)
    spots.forEach((spot) => {
      bounds.extend(
        new window.Tmapv2.LatLng(spot.coordinates.lat, spot.coordinates.lon)
      );
    });

    if (routePath) {
      routePath.forEach((p) => {
        bounds.extend(new window.Tmapv2.LatLng(p.lat, p.lon));
      });
    }

    // Draw Markers
    spots.forEach((spot, idx) => {
      const latLng = new window.Tmapv2.LatLng(
        spot.coordinates.lat,
        spot.coordinates.lon
      );

      // Marker Style based on type
      let markerColor = '#FFA500'; // Default Orange
      let label = (idx + 1).toString();

      if (spot.type === 'start') {
        markerColor = '#3B82F6'; // Blue
        label = '출';
      } else if (spot.type === 'end') {
        markerColor = '#EF4444'; // Red
        label = '도';
      }

      new window.Tmapv2.Marker({
        position: latLng,
        map: map,
        iconHTML: `
          <div style="
            width: 24px; 
            height: 24px; 
            background-color: ${markerColor}; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 10px;">
            ${label}
          </div>
        `,
        offset: new window.Tmapv2.Point(12, 12),
      });
    });

    // 3. Draw Polyline (Actual Path or Straight Lines)
    let polylinePath: any[] = [];

    if (routePath && routePath.length > 0) {
      // Use actual calculated path (curved)
      polylinePath = routePath.map(
        (p) => new window.Tmapv2.LatLng(p.lat, p.lon)
      );
    } else {
      // Fallback: Connect spots with straight lines
      polylinePath = spots.map(
        (s) => new window.Tmapv2.LatLng(s.coordinates.lat, s.coordinates.lon)
      );
    }

    if (polylinePath.length > 1) {
      new window.Tmapv2.Polyline({
        path: polylinePath,
        strokeColor: '#FFA500', // Orange path
        strokeWeight: 4,
        strokeOpacity: 0.8,
        map: map,
      });
    }

    // 4. Fit Bounds (Auto Zoom/Center)
    map.fitBounds(bounds);
  }, [isLoaded, spots, routePath, width, height]);

  return (
    <div
      ref={mapRef}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        pointerEvents: 'none', // Disable all interactions
      }}
      className="bg-gray-100"
    />
  );
}
