import { FavoritesAPI } from '@/api/favorites';
import fallbackImage from '@/assets/images/fallback_spot.jpg';
import AccessibilityInfo from '@/components/view/AccessibilityInfo';
import { useAnalytics } from '@/hooks/useAnalytics';
import useTmapScript from '@/hooks/useTmapScript';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type PanInfo,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { MapPin, ThumbsUp, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  spot: SpotCard;
  isVisible: boolean;
  onDismiss: () => void;
  userLocation?: Coordinates;
}

export default function SpotDetailModal({
  spot,
  isVisible,
  onDismiss,
  userLocation,
}: Props) {
  const queryClient = useQueryClient();
  const [showMap, setShowMap] = useState(false);
  const analytics = useAnalytics();

  // Framer Motion Hooks
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(
    x,
    [-200, -150, 0, 150, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  // Overlay Opacity
  const keepOpacity = useTransform(x, [20, 150], [0, 1]);
  const deleteOpacity = useTransform(x, [-150, -20], [1, 0]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const deleteMutation = useMutation({
    mutationFn: async (contentId: number) => {
      // Assuming userId 1 as per current requirements
      await FavoritesAPI.removeFavorite(contentId, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      onDismiss();
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(spot.content_id);
  };

  const handleRoute = () => {
    // Track Navigation Event
    analytics.trackNavigation(spot.content_id.toString(), spot.lat, spot.lon);
    setShowMap(true);
  };

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 70 || velocity > 300) {
      // Keep Action (Swipe Right)
      // Animate out to right, then dismiss
      await controls.start({
        x: 500,
        opacity: 0,
        transition: { duration: 0.2 },
      });
      onDismiss();
    } else if (offset < -70 || velocity < -300) {
      // Delete Action (Swipe Left)
      // Animate out to left
      await controls.start({
        x: -500,
        opacity: 0,
        transition: { duration: 0.2 },
      });
      handleDelete(); // This calls onDismiss on success
    } else {
      // Reset
      controls.start({ x: 0, rotate: 0 });
    }
  };

  // Helper to Calc Distance (Haversine) - Reuse or Import
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const formattedDistance = userLocation
    ? `${getDistance(userLocation.lat, userLocation.lon, spot.lat, spot.lon)}km`
    : spot.distance > 0
      ? `${(spot.distance / 1000).toFixed(1)}km`
      : '';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      />

      {/* Swipe Overlays - Outside the card, bottom corners */}
      {/* Keep Overlay (Left/Green) */}
      <motion.div
        style={{ opacity: keepOpacity }}
        className="fixed bottom-24 left-8 z-40 border-4 border-green-500 rounded-lg p-4 transform -rotate-12 bg-white/90 dark:bg-slate-800/90 pointer-events-none shadow-xl scale-125"
      >
        <div className="flex flex-col items-center">
          <ThumbsUp size={56} className="text-green-500" />
          <span className="text-3xl font-black text-green-500 uppercase tracking-widest mt-2">
            유지
          </span>
        </div>
      </motion.div>

      {/* Delete Overlay (Right/Red) */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="fixed bottom-24 right-8 z-40 border-4 border-red-500 rounded-lg p-4 transform rotate-12 bg-white/90 dark:bg-slate-800/90 pointer-events-none shadow-xl scale-125"
      >
        <div className="flex flex-col items-center">
          <Trash2 size={56} className="text-red-500" />
          <span className="text-3xl font-black text-red-500 uppercase tracking-widest mt-2">
            삭제
          </span>
        </div>
      </motion.div>

      {/* Swipeable Modal Content */}
      <motion.div
        className="relative w-full max-w-4xl max-h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden touch-none"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
      >
        {/* Header - No Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 shrink-0 pointer-events-none">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 pr-4">
            {spot.title}
          </h2>
        </div>

        {/* Scrollable Body - stopPropagation on scroll events/touch to allow scrolling? 
            Actually with drag="x", vertical scroll usually works if we don't lock it.
            But we need to ensure text selection or interaction.
         */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-6"
          onPointerDown={(e) => e.stopPropagation()} // Optional: tweaks for better interaction
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Image */}
            <div className="md:w-1/2 shrink-0 pointer-events-none">
              <div className="rounded-xl overflow-hidden shadow-md aspect-video bg-gray-100 dark:bg-slate-700">
                <img
                  src={spot.first_image || fallbackImage}
                  alt={spot.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImage;
                  }}
                />
              </div>
            </div>

            {/* Right: Details */}
            <div className="md:w-1/2 flex flex-col gap-4">
              {/* Address */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  주소
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {spot.addr_1}
                </p>
              </div>

              {/* Contact */}
              {spot.tel && (
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    연락처
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {spot.tel}
                  </p>
                </div>
              )}

              {/* Accessibility */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  편의시설
                </h4>
                <AccessibilityInfo spot={spot} />
              </div>

              {/* Distance */}
              {formattedDistance && (
                <div className="flex items-center gap-1 text-ormi-ember-500 font-bold mt-1">
                  <MapPin size={16} />
                  <span>현 위치에서 {formattedDistance}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          {spot.reviews && spot.reviews.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                방문자 리뷰 ({spot.reviews.length})
              </h3>
              <div className="space-y-3">
                {spot.reviews.map((review) => (
                  <div
                    key={review.review_id}
                    className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600"
                  >
                    <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed mb-2">
                      {review.detail}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Only Find Route */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 z-10 flex gap-3">
          <button
            onClick={handleRoute}
            className="flex-1 py-3 px-4 rounded-xl bg-jeju-light-primary text-white font-bold hover:bg-jeju-light-primary/90 transition-shadow shadow-md hover:shadow-lg"
          >
            길찾기
          </button>
        </div>
      </motion.div>

      {/* Floating Close Button (Bottom) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={onDismiss}
          className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-transform hover:scale-110 active:scale-95"
        >
          <X size={28} />
        </button>
      </div>

      {/* Map Overlay - Full Screen with High Z-Index */}
      {showMap && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden relative shadow-2xl animate-fade-in">
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 text-gray-800 dark:text-white p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-lg transition-transform hover:scale-110"
            >
              <X size={24} />
            </button>

            <div className="flex-1 relative bg-gray-100 dark:bg-slate-900">
              <RouteMap
                startLat={userLocation?.lat || 0}
                startLon={userLocation?.lon || 0}
                endLat={spot.lat}
                endLon={spot.lon}
                spotName={spot.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tmap Route Visualization Component
function RouteMap({
  startLat,
  startLon,
  endLat,
  endLon,
  spotName,
}: {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  spotName: string;
}) {
  const { isLoaded } = useTmapScript();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);
  const polylineRef = useRef<Tmapv2.Polyline | null>(null);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!isLoaded || !mapElement || !window.Tmapv2) return;

    // Initialize Map
    if (!mapInstance.current) {
      const map = new window.Tmapv2.Map(mapElement, {
        center: new window.Tmapv2.LatLng(
          (startLat + endLat) / 2,
          (startLon + endLon) / 2
        ),
        width: '100%',
        height: '100%',
        zoom: 10,
      });
      mapInstance.current = map;
    }

    const map = mapInstance.current;
    if (!map) return;

    // Clear previous usage if needed (though component remounts)
    map.setCenter(
      new window.Tmapv2.LatLng((startLat + endLat) / 2, (startLon + endLon) / 2)
    );

    // Start Marker
    new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(startLat, startLon),
      map: map,
      label: '내 위치',
    });

    // End Marker
    new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(endLat, endLon),
      map: map,
      label: spotName,
      // Use default marker or reliable HTTPS one
    });

    // Fit Bounds
    const bounds = new window.Tmapv2.LatLngBounds();
    bounds.extend(new window.Tmapv2.LatLng(startLat, startLon));
    bounds.extend(new window.Tmapv2.LatLng(endLat, endLon));
    map.fitBounds(bounds);

    // Fetch Route
    const fetchRoute = async () => {
      try {
        const headers = {
          appKey: import.meta.env.VITE_TMAP_APP_KEY,
          'Content-Type': 'application/json',
        };

        const response = await fetch(
          'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json',
          {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              startX: startLon.toString(),
              startY: startLat.toString(),
              endX: endLon.toString(),
              endY: endLat.toString(),
              reqCoordType: 'WGS84GEO',
              resCoordType: 'WGS84GEO',
              startName: 'Start',
              endName: 'End',
            }),
          }
        );

        const data = await response.json();

        if (data.features) {
          const path = [];
          for (const feature of data.features) {
            if (feature.geometry.type === 'LineString') {
              for (const coord of feature.geometry.coordinates) {
                path.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
              }
            }
          }

          if (polylineRef.current) {
            polylineRef.current.setMap(null);
          }

          polylineRef.current = new window.Tmapv2.Polyline({
            path: path,
            strokeColor: '#FF6B00', // Jeju Orange
            strokeWeight: 6,
            map: map,
          });
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
      }
    };

    fetchRoute();

    return () => {
      // Cleanup map if needed (Tmap destroy)
      if (mapInstance.current && mapInstance.current.destroy) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      if (mapElement) {
        mapElement.innerHTML = '';
      }
    };
  }, [isLoaded, startLat, startLon, endLat, endLon, spotName]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[500]">
        <button
          onClick={() =>
            window.open(
              `https://apis.openapi.sk.com/tmap/app/routes?appKey=${import.meta.env.VITE_TMAP_APP_KEY}&name=${spotName}&lon=${endLon}&lat=${endLat}`
            )
          }
          className="py-3 px-6 rounded-full bg-jeju-light-primary text-white font-bold shadow-lg hover:bg-jeju-light-primary/90 transition-transform active:scale-95"
        >
          Tmap 앱으로 안내
        </button>
      </div>
    </div>
  );
}
