import fallbackImage from '@/assets/images/fallback_spot.jpg';
import strollerAnimation from '@/assets/lotties/baby_care.json';
import walkingDogAnimation from '@/assets/lotties/walking_dog.json';
import useTmapScript from '@/hooks/useTmapScript';
import type { SavedLocation } from '@/store/mapStore';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import {
  createCurrentLocationMarker,
  createPinMarker,
  createSpotMarker,
} from '@/utils/marker';
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
  savedLocations?: SavedLocation[];
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
  const color = theme === 'green' ? '#10B981' : '#FFA500';
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
  savedLocations = [],
  routeStart,
  routeEnd,
  routeWaypoints = [],
  routePath,
  markerTheme = 'orange',
}: Props) {
  const { isLoaded } = useTmapScript();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);

  const ignoreMapClickRef = useRef(false);

  const spotMarkersRef = useRef<Tmapv2.Marker[]>([]);
  const gpsMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const referenceMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const savedMarkersRef = useRef<Tmapv2.Marker[]>([]);

  // Route Refs
  const routeStartMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const routeEndMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const routeWaypointMarkersRef = useRef<Tmapv2.Marker[]>([]);
  const routePolylineRef = useRef<Tmapv2.Polyline | null>(null);

  const onMapInteractionRef = useRef(onMapInteraction);
  const onMarkerClickRef = useRef(onMarkerClick);

  const mainColor = markerTheme === 'green' ? '#10B981' : '#FFA500';

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
    } else {
      if (typeof map.setScrollwheel === 'function') map.setScrollwheel(false);
      if (typeof map.setDraggable === 'function') map.setDraggable(false);
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
        onMarkerClickRef.current?.(index);
      };

      marker.addListener('click', handleMarkerClick);
      marker.addListener('touchend', handleMarkerClick);

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

  // 1. GPS Location Marker (Neon)
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.setMap(null);
      gpsMarkerRef.current = null;
    }

    if (userLocation) {
      // Hide neon marker if it's the same as reference location (Reference Lottie takes priority)
      const isRef =
        centerLocation &&
        Math.abs(userLocation.lat - centerLocation.lat) < 0.0001 &&
        Math.abs(userLocation.lon - centerLocation.lon) < 0.0001;

      if (!isRef) {
        gpsMarkerRef.current = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(
            userLocation.lat,
            userLocation.lon
          ),
          map: mapInstance.current!,
          iconHTML: createCurrentLocationMarker(mainColor),
          zIndex: 200,
        });
      }
    }
  }, [userLocation, centerLocation, mainColor, isLoaded]);

  // 2. Reference Location Marker (Lottie)
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2 || !centerLocation) return;

    const isDog = markerTheme === 'green';
    const markerId = 'val-reference-marker';

    const animationData = isDog ? walkingDogAnimation : strollerAnimation;
    const filterStyle = isDog
      ? 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white)'
      : 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white) drop-shadow(1px 0 0 black) drop-shadow(-1px 0 0 black) drop-shadow(0 1px 0 black) drop-shadow(0 -1px 0 black)';

    const contentStyle = {
      width: isDog ? '130%' : '50%',
      height: isDog ? '130%' : '50%',
      margin: '0 auto',
      filter: filterStyle,
      transform:
        routePath && routePath.length > 1 && routePath[1].lon < routePath[0].lon
          ? 'scaleX(-1)'
          : 'none',
      transition: 'all 0.3s ease',
    };

    const renderContent = (root: Root) => {
      root.render(
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
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

    if (referenceMarkerRef.current) {
      referenceMarkerRef.current.setPosition(
        new window.Tmapv2.LatLng(centerLocation.lat, centerLocation.lon)
      );
      const customMarker = referenceMarkerRef.current as CustomMarker;
      if (customMarker._reactRoot) {
        renderContent(customMarker._reactRoot);
      }
    } else {
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(
          centerLocation.lat,
          centerLocation.lon
        ),
        map: mapInstance.current!,
        iconHTML: `<div id="${markerId}" style="width: 100px; height: 100px; transform: translate(-50%, -100%); pointer-events: none;"></div>`,
        zIndex: 300,
      });
      referenceMarkerRef.current = marker;

      const mountLottie = (attempts = 0) => {
        const container = document.getElementById(markerId);
        if (container) {
          try {
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
  }, [centerLocation, isLoaded, markerTheme, routePath]);

  // 3. Saved Locations Markers (Pins)
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    savedMarkersRef.current.forEach((m) => m.setMap(null));
    savedMarkersRef.current = [];

    savedLocations.forEach((loc) => {
      // Don't show pin if it's the active reference location
      const isActive =
        centerLocation &&
        Math.abs(loc.coordinates.lat - centerLocation.lat) < 0.0001 &&
        Math.abs(loc.coordinates.lon - centerLocation.lon) < 0.0001;

      if (!isActive) {
        const marker = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(
            loc.coordinates.lat,
            loc.coordinates.lon
          ),
          map: mapInstance.current!,
          iconHTML: createPinMarker(mainColor, false, 50),
          zIndex: 50,
        });
        savedMarkersRef.current.push(marker);
      }
    });
  }, [savedLocations, centerLocation, mainColor, isLoaded]);

  // Route Visualization
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2) return;

    const map = mapInstance.current;

    const createWaypointMarker = (lat: number, lon: number, index: number) => {
      return new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(lat, lon),
        map: map,
        iconHTML: `
          <div style="width: 24px; height: 24px; background-color: #10B981; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
            ${index + 1}
          </div>
        `,
        zIndex: 200,
        offset: new window.Tmapv2.Point(12, 12),
      });
    };

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (routePath && routePath.length > 0) {
      const path = routePath.map((p) => new window.Tmapv2.LatLng(p.lat, p.lon));
      routePolylineRef.current = new window.Tmapv2.Polyline({
        path: path,
        strokeColor: markerTheme === 'green' ? '#10B981' : '#FFA500',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        map: map,
      });

      const bounds = new window.Tmapv2.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds);
    }

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
        offset: new window.Tmapv2.Point(15, 15),
      });
    }

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
        offset: new window.Tmapv2.Point(15, 15),
      });
    }

    routeWaypointMarkersRef.current.forEach((m) => m.setMap(null));
    routeWaypointMarkersRef.current = [];
    if (routeWaypoints) {
      routeWaypoints.forEach((wp, idx) => {
        const marker = createWaypointMarker(wp.lat, wp.lon, idx);
        routeWaypointMarkersRef.current.push(marker);
      });
    }
  }, [routeStart, routeEnd, routeWaypoints, routePath, isLoaded, markerTheme]);

  return (
    <div
      ref={mapRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${isMapMode ? 'z-10' : 'z-0'}`}
    />
  );
}
