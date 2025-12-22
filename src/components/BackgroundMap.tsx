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
import { useEffect, useRef, useState } from 'react';
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
  centerAddress?: string;
  onReferenceMarkerClick?: () => void;
  onOtherMarkerClick?: (coords: Coordinates) => void;
  onReferenceMarkerDragEnd?: (lat: number, lon: number) => void;
}

// Extend Marker locally for React Root attachment
// Extend Marker locally for React Root attachment and missing types
interface CustomMarker extends Tmapv2.Marker {
  _reactRoot?: Root;
  setDraggable: (draggable: boolean) => void;
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
  centerAddress,
  onReferenceMarkerClick,
  onOtherMarkerClick,
  onReferenceMarkerDragEnd,
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
        scrollwheel: true,
        draggable: true,
      });

      // Add diagnostic listeners
      map.addListener('dragstart', () => {
        onMapInteractionRef.current?.();
      });
      map.addListener('dragend', () => console.log('📍 Map Drag End'));
      map.addListener('zoomend', () => console.log('🔍 Map Zoom End'));

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

    console.log(
      'Syncing Map Interaction Mode:',
      isMapMode ? 'Interactive' : 'Static'
    );

    // Tmap v2 interaction update
    // setDraggable/setScrollwheel might not exist in all versions, setOptions is safer.
    const interactionOptions = {
      draggable: true,
      scrollwheel: true,
    };

    if (typeof map.setOptions === 'function') {
      map.setOptions(interactionOptions);
    } else {
      // Fallback to direct methods if setOptions fails or is missing
      if (typeof map.setDraggable === 'function') {
        map.setDraggable(true);
      }
      if (typeof map.setScrollwheel === 'function') {
        map.setScrollwheel(true);
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
        offset: new window.Tmapv2.Point(0, 0), // HTML transform handles centering
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
        const marker = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(
            userLocation.lat,
            userLocation.lon
          ),
          map: mapInstance.current!,
          iconHTML: createCurrentLocationMarker(mainColor),
          zIndex: 200,
          offset: new window.Tmapv2.Point(0, 0), // HTML transform handles centering
        });

        // Add Click Listener for "Set as Reference"
        marker.addListener('click', () => {
          ignoreMapClickRef.current = true;
          setTimeout(() => (ignoreMapClickRef.current = false), 200);
          onOtherMarkerClick?.(userLocation);
        });
        marker.addListener('touchend', () => {
          ignoreMapClickRef.current = true;
          setTimeout(() => (ignoreMapClickRef.current = false), 200);
          onOtherMarkerClick?.(userLocation);
        });

        gpsMarkerRef.current = marker;
      }
    }
  }, [userLocation, centerLocation, mainColor, isLoaded, onOtherMarkerClick]);

  // 2. Reference Location Marker (Lottie + Address + Drag)
  useEffect(() => {
    if (!mapInstance.current || !window.Tmapv2 || !centerLocation) return;

    const isDog = markerTheme === 'green';
    const markerId = 'val-reference-marker';

    const animationData = isDog ? walkingDogAnimation : strollerAnimation;
    const filterStyle = isDog
      ? 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white)'
      : `drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white) drop-shadow(1px 0 0 ${mainColor}) drop-shadow(-1px 0 0 ${mainColor}) drop-shadow(0 1px 0 ${mainColor}) drop-shadow(0 -1px 0 ${mainColor})`;

    // SVG for the Base Pin (Normal Custom Marker Style)
    const PinSVG = ({ color }: { color: string }) => (
      <svg
        width="24"
        height="30"
        viewBox="0 0 24 30"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))',
          transform: 'scale(1)',
        }}
      >
        <path
          d="M12 0C5.37258 0 0 5.37258 0 12C0 20 12 30 12 30C12 30 24 20 24 12C24 5.37258 18.6274 0 12 0Z"
          fill={color}
        />
        <circle cx="12" cy="12" r="4" fill="white" />
      </svg>
    );

    const renderContent = (root: Root) => {
      // Inline component for interaction logic
      const ContentWrapper = () => {
        const [isDragging, setIsDragging] = useState(false);
        const timerRef = useRef<NodeJS.Timeout | null>(null);

        const handlePressStart = () => {
          timerRef.current = setTimeout(() => {
            if (referenceMarkerRef.current) {
              (
                referenceMarkerRef.current as unknown as CustomMarker
              ).setDraggable(true);
              setIsDragging(true);
              // Haptic feedback if available (mobile)
              if (navigator.vibrate) navigator.vibrate(50);
            }
          }, 1000); // 1s long press
        };

        const handlePressEnd = () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        };

        const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
          if (isDragging) return; // Don't trigger click if we just dragged
          e.stopPropagation();
          ignoreMapClickRef.current = true;
          setTimeout(() => (ignoreMapClickRef.current = false), 200);
          onReferenceMarkerClick?.();
        };

        return (
          <div
            className="flex flex-col items-center justify-end relative"
            style={{
              width: '100%',
              height: '100%',
              cursor: isDragging ? 'grabbing' : 'pointer',
              // Border box for debugging if needed, but keeping it clean
            }}
            onMouseDown={handlePressStart}
            onTouchStart={handlePressStart}
            onMouseUp={handlePressEnd}
            onTouchEnd={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onClick={handleClick}
          >
            {/* 1. Base Marker (The Anchor) */}
            {/* The wrapper is 24x30, offset set to bottom center in Tmap config below */}
            <div className="z-10 relative">
              <PinSVG color={mainColor} />
            </div>

            {/* 2. Badge "Reference Location" - Relative to Pin */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50 whitespace-nowrap pointer-events-none">
              <div
                className="text-white font-bold shadow-md animate-bounce-subtle flex flex-col items-center"
                style={{
                  backgroundColor: mainColor,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              >
                <span>
                  {isDragging
                    ? '위치를 이동하세요'
                    : centerAddress || '기준 위치'}
                </span>
                {/* Badge Tail */}
                <div
                  className="w-2.5 h-2.5 transform rotate-45 -mb-5 mt-1"
                  style={{ backgroundColor: mainColor }}
                ></div>
              </div>
            </div>

            {/* 3. Lottie Character - Absolute Positioning for Fine Tuning */}
            {/* 
                User requested absolute/relative structure for fine tuning. 
                We position this relative to the bottom-center of the main container (which aligns with the pin bottom).
                'bottom-0' aligns the bottom of this div effectively with the map point (since container height ~= pin height).
            */}
            <div
              className={`absolute left-1/2 z-20 pointer-events-none ${
                isDog ? 'bottom-0' : 'bottom-0' /* User can adjust these */
              }`}
              style={{
                width: isDog ? '150px' : '90px',
                height: isDog ? '150px' : '90px',
                transform: `translateX(-50%) translateX(${
                  isDog ? '40px' : '20px'
                }) translateY(${isDog ? '-5px' : '-5px'}) ${
                  routePath &&
                  routePath.length > 1 &&
                  routePath[1].lon < routePath[0].lon
                    ? 'scaleX(-1)'
                    : ''
                }`,
                filter: `${filterStyle} drop-shadow(0 0 15px ${mainColor})`,
                opacity: isDragging ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              <Lottie
                animationData={animationData}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Anchoring shadow (Optional, for the character feet) */}
            <div
              className="absolute bottom-0 w-8 h-2 bg-black/20 blur-sm rounded-full mb-1 z-0"
              style={{
                left: '50%',
                transform: `translateX(-50%) translateX(${
                  isDog ? '40px' : '20px'
                })`, // Match Lottie X offset
              }}
            />
          </div>
        );
      };

      root.render(
        // Need to wrap via State to handle re-renders if props change?
        // Use a simple wrapper that we can force update or just rely on parent effect re-running renderContent
        <ContentWrapper />
      );
    };

    if (referenceMarkerRef.current) {
      referenceMarkerRef.current.setPosition(
        new window.Tmapv2.LatLng(centerLocation.lat, centerLocation.lon)
      );
      // Reset draggable state on prop update just in case
      (referenceMarkerRef.current as CustomMarker).setDraggable(false);

      const customMarker = referenceMarkerRef.current as CustomMarker;
      if (customMarker._reactRoot) {
        renderContent(customMarker._reactRoot);
      }
    } else {
      // Create a container that fits the Pin (24x30). The Lottie will overflow out of it.
      // Tmap offset needs to put the bottom-center of this div at the lat/lon.
      // 24px wide -> center is 12px. 30px high -> bottom is 30px.
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(
          centerLocation.lat,
          centerLocation.lon
        ),
        map: mapInstance.current!,
        iconHTML: `<div id="${markerId}" style="width: 24px; height: 30px; pointer-events: auto; overflow: visible;"></div>`,
        zIndex: 1000,
        draggable: false,
        offset: new window.Tmapv2.Point(12, 30), // Align Bottom Center of Pin to Map Point
      });
      referenceMarkerRef.current = marker;

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        (marker as CustomMarker).setDraggable(false); // Disable drag after drop
        if (onReferenceMarkerDragEnd) {
          onReferenceMarkerDragEnd(pos.lat(), pos.lng());
        }
      });

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
  }, [
    centerLocation,
    isLoaded,
    markerTheme,
    routePath,
    mainColor,
    centerAddress,
    onReferenceMarkerClick,
    onReferenceMarkerDragEnd,
  ]); // Added centerAddress to deps

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
        // Format Label: "서귀포시 서귀동" (Up to Dong/Eup/Myeon)
        let label = loc.name;
        // Remove standard prefix
        label = label
          .replace(/제주특별자치도\s*/g, '')
          .replace(/제주시\s*/g, '제주시 ')
          .replace(/서귀포시\s*/g, '서귀포시 ')
          .trim();

        const dongPattern = /([가-힣]+([동읍면]))/;
        const match = label.match(dongPattern);
        if (match && match.index !== undefined) {
          // Keep everything up to the end of the first dong/eup/myeon occurrence
          const endIndex = match.index + match[0].length;
          label = label.substring(0, endIndex);
        }

        const marker = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(
            loc.coordinates.lat,
            loc.coordinates.lon
          ),
          map: mapInstance.current!,
          iconHTML: createPinMarker(mainColor, false, 50, label),
          zIndex: 250,
        });

        // Add click listener
        marker.addListener('click', () => {
          ignoreMapClickRef.current = true;
          setTimeout(() => (ignoreMapClickRef.current = false), 200);
          onOtherMarkerClick?.(loc.coordinates);
        });
        marker.addListener('touchend', () => {
          ignoreMapClickRef.current = true;
          setTimeout(() => (ignoreMapClickRef.current = false), 200);
          onOtherMarkerClick?.(loc.coordinates);
        });

        savedMarkersRef.current.push(marker);
      }
    });
  }, [savedLocations, centerLocation, mainColor, isLoaded, onOtherMarkerClick]);

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
      style={{ touchAction: 'manipulation' }}
    />
  );
}
