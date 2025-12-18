import fallbackImage from '@/assets/images/fallback_spot.jpg';
import strollerAnimation from '@/assets/lotties/baby_care.json';
import useTmapScript from '@/hooks/useTmapScript';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import { createOrangeMarker, createSpotMarker } from '@/utils/marker';
import Lottie from 'lottie-react';
import { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';

interface Props {
  spots: SpotCard[];
  currentSpotIndex: number;
  isMapMode?: boolean;
  onMapInteraction?: () => void;
  onMarkerClick?: (index: number) => void;
  userLocation?: Coordinates | null;
  centerLocation?: Coordinates;
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
}: Props) {
  const { isLoaded } = useTmapScript();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);

  // Ref to block map click when marker is clicked (prevents event bubbling issues)
  const ignoreMapClickRef = useRef(false);

  const spotMarkersRef = useRef<Tmapv2.Marker[]>([]);
  const userMarkerRef = useRef<Tmapv2.Marker | null>(null);
  const referenceMarkerRef = useRef<Tmapv2.Marker | null>(null);

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

  return (
    <div
      ref={mapRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${
        isMapMode ? 'z-10' : 'z-0'
      }`}
    />
  );
}
