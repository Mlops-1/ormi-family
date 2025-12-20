import fallbackImage from '@/assets/images/fallback_spot.jpg';
import strollerAnimation from '@/assets/lotties/baby_care.json';
import walkingDogAnimation from '@/assets/lotties/walking_dog.json';
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
  markerTheme?: 'orange' | 'green';
}

// Extend Marker locally for React Root attachment
interface CustomMarker extends Tmapv2.Marker {
  _reactRoot?: Root;
}

const createSimsMarker = (theme: 'orange' | 'green') => {
  const color = theme === 'green' ? '#10B981' : '#FF6B00';
  return `
    <div style="display: flex; justify-content: center; align-items: center; width: 30px; height: 30px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
        <path d="M12 2L2 12L12 22L22 12L12 2Z" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    </div>
  `;
};

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
  routeWaypoints = [],
  routePath,
  markerTheme = 'orange',
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
        iconHTML: createSpotMarker(
          spot.first_image || fallbackImage,
          false,
          markerTheme
        ),
      });

      const handleMarkerClick = () => {
        ignoreMapClickRef.current = true;
        setTimeout(() => {
          ignoreMapClickRef.current = false;
        }, 200);

        // Log spot data for debugging
        console.log('Marker Clicked/Touched:', {
          index,
          spot,
          valid: !!spot.content_id && !!spot.lat && !!spot.lon,
        });

        onMarkerClickRef.current?.(index);
      };

      marker.addListener('click', handleMarkerClick);
      marker.addListener('touchend', handleMarkerClick); // Add touch support

      spotMarkersRef.current.push(marker);
    });
  }, [spots, isLoaded, markerTheme]);

  // Update Active Spot Marker State
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2 || spots.length === 0) return;

    spotMarkersRef.current.forEach((marker, idx) => {
      const spot = spots[idx];
      const isActive = idx === currentSpotIndex;
      if (typeof marker.setIconHTML === 'function') {
        marker.setIconHTML(
          createSpotMarker(
            spot.first_image || fallbackImage,
            isActive,
            markerTheme
          )
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
  }, [currentSpotIndex, isMapMode, spots, markerTheme]);

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

    const isDog = markerTheme === 'green';
    const markerId = 'val-user-marker'; // Fixed ID for stability

    // Style Configuration
    const animationData = isDog ? walkingDogAnimation : strollerAnimation;
    const filterStyle = isDog
      ? 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white)' // Dog: White halo only
      : 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white) drop-shadow(1px 0 0 black) drop-shadow(-1px 0 0 black) drop-shadow(0 1px 0 black) drop-shadow(0 -1px 0 black)'; // Stroller: Strong outline

    // Size Logic: Container is effectively 100px (set below).
    // Dog: Full size (scale 1.2 or just 100%).
    // Stroller: Original size (approx 70px) -> Scale down to ~70%.
    const contentStyle = {
      width: isDog ? '130%' : '50%',
      height: isDog ? '130%' : '50%',
      margin: '0 auto', // Center
      filter: filterStyle,
      transform:
        routePath && routePath.length > 1 && routePath[1].lon < routePath[0].lon
          ? 'scaleX(-1)'
          : 'none',
      transition: 'all 0.3s ease', // Smooth transition
    };

    const renderContent = (root: Root) => {
      root.render(
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end', // Feet on ground
            justifyContent: 'center',
          }}
        >
          <div style={{ ...contentStyle, marginBottom: '10%' }}>
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      );
    };

    if (userMarkerRef.current) {
      // 1. UPDATE Existing Marker
      userMarkerRef.current.setPosition(
        new window.Tmapv2.LatLng(userLocation.lat, userLocation.lon)
      );

      // Instant Re-render of React Content
      const customMarker = userMarkerRef.current as CustomMarker;
      if (customMarker._reactRoot) {
        renderContent(customMarker._reactRoot);
      }
    } else {
      // 2. CREATE New Marker
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(userLocation.lat, userLocation.lon),
        map: mapInstance.current!,
        // Increased container size to 100px to accommodate larger dog
        // Using translate(-50%, -100%) to anchor at the bottom center (feet)
        iconHTML: `<div id="${markerId}" style="width: 100px; height: 100px; transform: translate(-50%, -100%); pointer-events: none;"></div>`,
        zIndex: 999,
      });
      userMarkerRef.current = marker;

      const mountLottie = (attempts = 0) => {
        const container = document.getElementById(markerId);
        if (container) {
          try {
            // Check if root already exists on this container (cleanup safety)
            // (In React 18 createRoot throws if called on existing root, but we track via _reactRoot)

            const root = createRoot(container);
            (marker as CustomMarker)._reactRoot = root;
            renderContent(root);
          } catch (e) {
            console.error('Lottie Mount Error:', e);
          }
        } else if (attempts < 20) {
          setTimeout(() => mountLottie(attempts + 1), 100);
        }
      };

      mountLottie();
    }
  }, [userLocation, isLoaded, routeStart, markerTheme, routePath]);

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
        });
        referenceMarkerRef.current = marker;
      }
    }
  }, [centerLocation, userLocation, isLoaded]);

  // Route Visualization
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    const map = mapInstance.current;

    // Helper to create simple colored marker for waypoints only
    const createWaypointMarker = (lat: number, lon: number, index: number) => {
      return new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(lat, lon),
        map: map,
        iconHTML: `
          <div style="
            width: 24px; 
            height: 24px; 
            background-color: #10B981; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">
            ${index + 1}
          </div>
        `,
        zIndex: 200,
        // anchor not supported in TS defs, handle in CSS/HTML
        offset: new window.Tmapv2.Point(12, 12), // Center offset for 24x24
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
        strokeColor: markerTheme === 'green' ? '#10B981' : '#FF6B00', // Green for Dog Mode, Orange for others
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
      routeStartMarkerRef.current = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(routeStart.lat, routeStart.lon),
        map: map,
        iconHTML: createSimsMarker(markerTheme),
        zIndex: 210,
        offset: new window.Tmapv2.Point(15, 15), // Center offset for 30x30
      });
    }

    // 3. End Marker
    if (routeEndMarkerRef.current) {
      routeEndMarkerRef.current.setMap(null);
      routeEndMarkerRef.current = null;
    }
    if (routeEnd) {
      routeEndMarkerRef.current = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(routeEnd.lat, routeEnd.lon),
        map: map,
        iconHTML: createSimsMarker(markerTheme),
        zIndex: 210,
        offset: new window.Tmapv2.Point(15, 15), // Center offset for 30x30
      });
    }

    // 4. Waypoint Markers
    routeWaypointMarkersRef.current.forEach((m) => m.setMap(null));
    routeWaypointMarkersRef.current = [];
    if (routeWaypoints) {
      routeWaypoints.forEach((wp, idx) => {
        const marker = createWaypointMarker(wp.lat, wp.lon, idx);
        routeWaypointMarkersRef.current.push(marker);
      });
    }
  }, [
    routeStart,
    routeEnd,
    routeWaypoints,
    routePath,
    isLoaded,
    markerTheme, // Added dependency
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
