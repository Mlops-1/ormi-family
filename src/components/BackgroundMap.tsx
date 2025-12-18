import fallbackImage from '@/assets/images/fallback_spot.jpg';
import strollerAnimation from '@/assets/lotties/baby_care.json';
import useTmapScript from '@/hooks/useTmapScript';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import { createOrangeMarker, createSpotMarker } from '@/utils/marker';
import Lottie from 'lottie-react';
import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

interface Props {
  spots: SpotCard[];
  currentSpotIndex: number;
  isMapMode?: boolean;
  onMapInteraction?: () => void;
  onMarkerClick?: (index: number) => void;
  userLocation?: Coordinates | null;
  centerLocation?: Coordinates;
  routeStart?: Coordinates;
  routeEnd?: Coordinates;
  routeWaypoints?: Coordinates[];
  routePath?: Coordinates[];
}

// Extend Marker locally for React Root attachment
interface CustomMarker extends Tmapv2.Marker {
  _reactRoot?: Root;
}

export default function BackgroundMap({
  spots,
  currentSpotIndex,
  isMapMode = false,
  onMapInteraction,
  onMarkerClick,
  userLocation,
  centerLocation,
  routeStart,
  routeEnd,
  routeWaypoints,
  routePath,
}: Props) {
  const { isLoaded } = useTmapScript();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);

  // Ref to block map click when marker is clicked (prevents event bubbling issues)
  const ignoreMapClickRef = useRef(false);

  const spotMarkersRef = useRef<Tmapv2.Marker[]>([]);
  const userMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const referenceMarkerRef = useRef<Tmapv2.Marker | null>(null);

  // Route Refs
  const routeStartMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const routeEndMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const routeWaypointMarkersRef = useRef<Tmapv2.Marker[]>([]);
  const routePolylineRef = useRef<Tmapv2.Polyline | null>(null);

  const onMapInteractionRef = useRef(onMapInteraction);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onMapInteractionRef.current = onMapInteraction;
    onMarkerClickRef.current = onMarkerClick;
  }, [onMapInteraction, onMarkerClick]);

  // Initialize Map
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance.current) {
      if (!window.Tmapv2) return;

      const map = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(33.3846, 126.5535),
        width: '100%',
        height: '100%',
        zoom: 11,
        zoomControl: false,
        scrollwheel: false,
        draggable: false,
      });

      map.addListener('click', () => {
        // If a marker was just clicked, ignore this map click
        if (ignoreMapClickRef.current) return;
        onMapInteractionRef.current?.();
      });

      mapInstance.current = map;
    }
  }, [isLoaded]);

  // Handle Map Mode Actions
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;
    const map = mapInstance.current;

    if (isMapMode) {
      if (typeof map.setScrollwheel === 'function') map.setScrollwheel(true);
      if (typeof map.setDraggable === 'function') map.setDraggable(true);
      if (typeof map.setOptions === 'function') {
        map.setOptions({ scrollwheel: true, draggable: true });
      }
    } else {
      if (typeof map.setScrollwheel === 'function') map.setScrollwheel(false);
      if (typeof map.setDraggable === 'function') map.setDraggable(false);
      if (typeof map.setOptions === 'function') {
        map.setOptions({ scrollwheel: false, draggable: false });
      }
    }
  }, [isMapMode]);

  // Update Spot Markers
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    spotMarkersRef.current.forEach((m) => m.setMap(null));
    spotMarkersRef.current = [];

    spots.forEach((spot, index) => {
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(spot.lat, spot.lon),
        map: mapInstance.current!,
        title: spot.title,
        iconHTML: createSpotMarker(spot.first_image || fallbackImage, false),
      });

      marker.addListener('click', () => {
        // Set ignore flag to true briefly to block map click listener
        ignoreMapClickRef.current = true;
        setTimeout(() => {
          ignoreMapClickRef.current = false;
        }, 200);

        onMarkerClickRef.current?.(index);
      });

      spotMarkersRef.current.push(marker);
    });
  }, [spots, isLoaded]);

  // Update Active Spot Marker State
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2 || spots.length === 0) return;

    spotMarkersRef.current.forEach((marker, idx) => {
      const spot = spots[idx];
      const isActive = idx === currentSpotIndex;
      if (typeof marker.setIconHTML === 'function') {
        marker.setIconHTML(
          createSpotMarker(spot.first_image || fallbackImage, isActive)
        );
      }
      if (isActive && typeof marker.setZIndex === 'function') {
        marker.setZIndex(100);
        if (!isMapMode) {
          mapInstance.current?.panTo(
            new window.Tmapv2.LatLng(spot.lat, spot.lon)
          );
        }
      } else if (!isActive && typeof marker.setZIndex === 'function') {
        marker.setZIndex(20);
      }
    });
  }, [currentSpotIndex, isMapMode, spots]);

  // User Location Marker
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        const marker = userMarkerRef.current as CustomMarker;
        if (marker._reactRoot) {
          setTimeout(() => marker._reactRoot?.unmount(), 0);
        }
        marker.setMap(null);
        userMarkerRef.current = null;
      }
      return;
    }

    if (userMarkerRef.current) {
      // Update existing marker position
      userMarkerRef.current.setPosition(
        new window.Tmapv2.LatLng(userLocation.lat, userLocation.lon)
      );
    } else {
      // Create new marker
      const markerId = `user-marker-${Date.now()}`;
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(userLocation.lat, userLocation.lon),
        map: mapInstance.current!,
        iconHTML: `<div id="${markerId}" style="width: 70px; height: 70px; transform: translate(-50%, -50%); pointer-events: none;"></div>`,
        zIndex: 999,
        title: '내 위치',
      });
      userMarkerRef.current = marker;

      // Mount Lottie animation
      const mountLottie = (attempts = 0) => {
        const container = document.getElementById(markerId);
        if (container) {
          try {
            const root = createRoot(container);
            root.render(
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  // Simulate an outline using drop-shadows: a tight dark one and a broader light glow, or just a thick white outline.
                  // Let's try a distinct white outline to make it pop.
                  filter:
                    'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white) drop-shadow(1px 0 0 black) drop-shadow(-1px 0 0 black) drop-shadow(0 1px 0 black) drop-shadow(0 -1px 0 black)',
                }}
              >
                <Lottie
                  animationData={strollerAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
            (marker as CustomMarker)._reactRoot = root;
          } catch (e) {
            console.error('Lottie Mount Error:', e);
          }
        } else if (attempts < 20) {
          // Retry if container not found yet (Tmap delay)
          setTimeout(() => mountLottie(attempts + 1), 100);
        }
      };

      mountLottie();
    }
  }, [userLocation, isLoaded]);

  // Reference Location Marker
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    if (referenceMarkerRef.current) {
      referenceMarkerRef.current.setMap(null);
      referenceMarkerRef.current = null;
    }

    // Only show orange marker if center is different from user
    if (centerLocation) {
      const isSameAsUser =
        userLocation &&
        Math.abs(userLocation.lat - centerLocation.lat) < 0.0001 &&
        Math.abs(userLocation.lon - centerLocation.lon) < 0.0001;

      if (!isSameAsUser) {
        const marker = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(
            centerLocation.lat,
            centerLocation.lon
          ),
          map: mapInstance.current!,
          iconHTML: createOrangeMarker(false),
          zIndex: 4,
          title: '검색 기준 위치',
        });
        referenceMarkerRef.current = marker;
      }
    }
  }, [centerLocation, userLocation, isLoaded]);

  // Route Visualization
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    const map = mapInstance.current;

    // Helper to create simple colored marker
    const createColorMarker = (
      lat: number,
      lon: number,
      color: string,
      label?: string
    ) => {
      return new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(lat, lon),
        map: map,
        iconHTML: `
          <div style="position: relative; display: flex; flex-col; gap: 4px; align-items: center; justify-content: center;">
             <div style="
                width: 32px; 
                height: 32px; 
                background-color: ${color}; 
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
             ">
             ${label || ''}
             </div>
             <div style="
                width: 0; 
                height: 0; 
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${color};
                margin-top: -6px;
             "></div>
          </div>
        `,
        zIndex: 200,
        offset: new window.Tmapv2.Point(16, 38), // Center bottom approximate
      });
    };

    // 1. Draw Path
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (routePath && routePath.length > 0) {
      const path = routePath.map((p) => new window.Tmapv2.LatLng(p.lat, p.lon));
      routePolylineRef.current = new window.Tmapv2.Polyline({
        path: path,
        strokeColor: '#FF6B00', // Main Orange
        strokeWeight: 6,
        strokeOpacity: 0.9,
        map: map,
      });

      // Fit bounds to show route
      const bounds = new window.Tmapv2.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds);
    }

    // 2. Start Marker
    if (routeStartMarkerRef.current) {
      routeStartMarkerRef.current.setMap(null);
      routeStartMarkerRef.current = null;
    }
    if (routeStart) {
      routeStartMarkerRef.current = createColorMarker(
        routeStart.lat,
        routeStart.lon,
        '#3B82F6', // Blue
        '출'
      );
      // Bring map center to start if just setting start? No, fitBounds usually handles it if path exists.
    }

    // 3. End Marker
    if (routeEndMarkerRef.current) {
      routeEndMarkerRef.current.setMap(null);
      routeEndMarkerRef.current = null;
    }
    if (routeEnd) {
      routeEndMarkerRef.current = createColorMarker(
        routeEnd.lat,
        routeEnd.lon,
        '#EF4444', // Red
        '도'
      );
    }

    // 4. Waypoint Markers
    routeWaypointMarkersRef.current.forEach((m) => m.setMap(null));
    routeWaypointMarkersRef.current = [];
    if (routeWaypoints) {
      routeWaypoints.forEach((wp, idx) => {
        const marker = createColorMarker(
          wp.lat,
          wp.lon,
          '#10B981', // Green
          (idx + 1).toString()
        );
        routeWaypointMarkersRef.current.push(marker);
      });
    }
  }, [
    routeStart,
    routeEnd,
    routeWaypoints,
    routePath,
    isLoaded,
    // Excluding routeStart/End/Ways logic from re-creation if simpler, but they are objects.
    // Safe to re-run on change.
  ]);

  return (
    <div
      ref={mapRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${
        isMapMode ? 'z-10' : 'z-0'
      }`}
    />
  );
}
