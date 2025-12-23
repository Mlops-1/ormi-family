import LoadingScreen from '@/components/common/LoadingScreen';
import ModeToggle from '@/components/common/ModeToggle';
import AppNotification from '@/components/common/Notification';
import BackgroundMap from '@/components/modules/BackgroundMap';
import GeoLocation from '@/components/modules/GeoLocation';
import ProtectedRoute from '@/components/modules/ProtectedRoute';
import RouteNavigation from '@/components/modules/RouteNavigation';
import BarrierFreeFilter from '@/components/view/BarrierFreeFilter';
import BottomNavigation, {
  type RouteAction,
} from '@/components/view/BottomNavigation';
import CategoryFilter from '@/components/view/CategoryFilter';
import OnboardingOverlay from '@/components/view/OnboardingOverlay';
import SwipeableCardList from '@/components/view/SwipeableCardList';
import WeatherWidget from '@/components/view/WeatherWidget';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAuth } from '@/hooks/useAuth';
import useGeoLocation from '@/hooks/useGeoLocation';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';
import { SPOT_QUERY } from '@/queries/spotQuery';
import { useBottomFilterStore } from '@/store/bottomFilterStore';
import { useFilterStore } from '@/store/filterStore';
import type { SavedLocation } from '@/store/mapStore';
import { useMapStore } from '@/store/mapStore';
import { useRouteStore } from '@/store/routeStore';
import { useUserStore } from '@/store/userStore';
import type { TmapReverseGeocodeResponse } from '@/types/api/tmap';
import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';
import type { AccessibilityType, FavoriteSpot, SpotCard } from '@/types/spot';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const Route = createFileRoute('/map')({
  component: MapPage,
});

function MapPage() {
  return (
    <ProtectedRoute>
      <MapPageContent />
    </ProtectedRoute>
  );
}

function MapPageContent() {
  const navigate = useNavigate();
  const location = useGeoLocation();
  const { profile } = useAuth(); // Keep using useAuth for now as source of truth for profile
  const { mode } = useUserStore();

  // Map State (UI and Data)
  const {
    isMapMode,
    setMapMode,
    focusedSpotIndex,
    setFocusedSpotIndex,
    manualLocation,
    setManualLocation,
    showOnboarding,
    setShowOnboarding,
    notifications,
    addNotification,
    removeNotification,
    allSpots,
    setAllSpots,
    addSavedLocation,
    savedLocations,
  } = useMapStore();

  // Route State (Separated)
  const {
    startPoint,
    endPoint,
    wayPoints,
    routePath,
    error: routeError,
    setStartPoint,
    setEndPoint,
    addWayPoint,
    convertEndToWaypoint,
    setWayPoints,
  } = useRouteStore();

  // Route Calculation Hook
  const { calculateRoute } = useRouteCalculation();

  // Show error notification when route calculation fails
  useEffect(() => {
    if (routeError) {
      addNotification(routeError);
    }
  }, [routeError, addNotification]);

  const {
    selectedCategoryIds,
    selectedBarrierIds,
    setSelectedBarrierIds,
    closeAllMenus,
  } = useFilterStore();

  const isDarkMode = mode === 'pet';
  const mainColorClass = isDarkMode ? 'bg-ormi-green-500' : 'bg-orange-500';

  // --- Favorites Mode State ---
  const { isFavoritesMode } = useBottomFilterStore();
  const [favorites, setFavorites] = useState<FavoriteSpot[]>([]);

  // --- Popup Interaction State ---
  const [popupType, setPopupType] = useState<'set-ref' | null>(null);
  const [popupTargetCoords, setPopupTargetCoords] =
    useState<Coordinates | null>(null);

  // Fetch favorites when entering favorites mode
  useEffect(() => {
    if (isFavoritesMode) {
      import('@/api/favorites').then(({ FavoritesAPI }) => {
        FavoritesAPI.getFavorites({ user_id: TEMP_USER_ID }).then((res) => {
          const sorted = (res.data || []).sort((a, b) => {
            const dateA = new Date(a.favorite_created_at || 0).getTime();
            const dateB = new Date(b.favorite_created_at || 0).getTime();
            return dateB - dateA;
          });
          setFavorites(sorted);
        });
      });
    }
  }, [isFavoritesMode]);

  const effectiveCoordinates = manualLocation || location.coordinates;

  // Fetch Address for Reference Location (Used for Label)
  const APP_KEY = import.meta.env.VITE_TMAP_APP_KEY;
  const { data: _centerAddress } = useQuery({
    queryKey: [
      'tmapAddress',
      effectiveCoordinates?.lat,
      effectiveCoordinates?.lon,
    ],
    queryFn: async () => {
      if (!APP_KEY || !effectiveCoordinates?.lat || !effectiveCoordinates?.lon)
        return '';
      try {
        const res = await axios.get<TmapReverseGeocodeResponse>(
          `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${effectiveCoordinates.lat}&lon=${effectiveCoordinates.lon}&addressType=A02&appKey=${APP_KEY}`
        );
        const info = res.data.addressInfo;
        if (info) {
          // Format similar to GeoLocation
          const city = (info.city_do || '')
            .replace(/제주특별자치도\s*/g, '')
            .trim();
          const gu = info.gu_gun || '';
          const dong = info.legalDong || info.adminDong || '';
          const parts = [];
          if (city) parts.push(city);
          if (gu) parts.push(gu);
          if (dong) parts.push(dong);
          return parts.length > 0 ? parts.join(' ') : '주소 없음';
        }
        return '';
      } catch {
        return '';
      }
    },
    enabled: !!APP_KEY && !!effectiveCoordinates,
    staleTime: 1000 * 60 * 5,
  });

  // Use TanStack Query for Spots
  const spotRequest = useMemo(
    () => ({
      user_id: TEMP_USER_ID,
      mapx: effectiveCoordinates?.lon || 0,
      mapy: effectiveCoordinates?.lat || 0,
      category: selectedCategoryIds,
    }),
    [effectiveCoordinates, selectedCategoryIds]
  );

  const {
    data: recommendedSpots,
    isFetching: isQueryFetching,
    isLoading: isQueryLoading,
  } = SPOT_QUERY.useGetRecommendedSpots(spotRequest);

  // Sync Query Data to Store
  useEffect(() => {
    if (recommendedSpots) {
      setAllSpots(recommendedSpots);
    }
  }, [recommendedSpots, setAllSpots]);

  // Close menus when switching from map mode to card mode
  useEffect(() => {
    if (!isMapMode) {
      closeAllMenus();
    }
  }, [isMapMode, closeAllMenus]);

  const isFetching = isQueryFetching || isQueryLoading;

  const handleAutoFixFilters = useCallback(() => {
    if (selectedBarrierIds.length === 0 || allSpots.length === 0) return;

    // Calculate ratings for all spots based on current barrier filters
    const ratedSpots = allSpots.map((spot: SpotCard) => {
      const matchedFilters = selectedBarrierIds.filter((f) => {
        const val = spot[f as keyof SpotCard];
        return val === 1;
      });
      return { spot, matchedFilters };
    });

    // Sort to find the best possible match
    ratedSpots.sort(
      (a, b) => b.matchedFilters.length - a.matchedFilters.length
    );
    const bestMatch = ratedSpots[0];

    if (
      bestMatch &&
      bestMatch.matchedFilters.length < selectedBarrierIds.length
    ) {
      // Set filters to only those satisfied by the best match
      setSelectedBarrierIds(bestMatch.matchedFilters);
      addNotification('일부 필터를 조정하여 장소를 찾았습니다.');
    }
  }, [allSpots, selectedBarrierIds, setSelectedBarrierIds, addNotification]);

  // Client-side Accessibility Filter logic
  const { displaySpots, isFallback } = useMemo(() => {
    if (isFavoritesMode) {
      return { displaySpots: favorites, isFallback: false };
    }

    if (!allSpots) return { displaySpots: [], isFallback: false };

    // Strict AND match
    const filtered = allSpots.filter((spot: SpotCard) => {
      return selectedBarrierIds.every((filter: AccessibilityType) => {
        const val = spot[filter];
        return val === 1;
      });
    });

    // If matches found, return them
    if (filtered.length > 0) {
      return { displaySpots: filtered, isFallback: false };
    }

    // If no matches but filters were active, trigger fallback state
    // We only trigger if allSpots has items (meaning category filter itself returned something)
    if (selectedBarrierIds.length > 0 && allSpots.length > 0) {
      return {
        displaySpots: [], // Hide markers/cards when nothing exactly matches
        isFallback: true,
      };
    }

    return { displaySpots: [], isFallback: false };
  }, [allSpots, selectedBarrierIds, isFavoritesMode, favorites]);

  // Effect to handle automatic map mode switch on fallback
  useEffect(() => {
    if (isFallback && !isMapMode) {
      setMapMode(true);
    }
  }, [isFallback, isMapMode, setMapMode]);

  const handleLocationChange = (coords: Coordinates, address?: string) => {
    setManualLocation(coords);
    if (address) {
      addSavedLocation({
        id: Date.now().toString(),
        name: address,
        coordinates: coords,
      });
    }
    // addNotification('위치가 변경되었습니다.'); // Removed as per request
  };

  const handleMarkerClick = (index: number) => {
    setFocusedSpotIndex(index);
    setMapMode(true);
  };

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.floor(d * 1000);
  };

  // Route Logic - Simplified with new store
  const getSelectedSpotPoint = (): RoutePoint | null => {
    if (!displaySpots[focusedSpotIndex]) return null;
    const spot = displaySpots[focusedSpotIndex];
    return {
      id: spot.content_id.toString(),
      name: spot.title,
      type: 'waypoint',
      coordinates: { lat: spot.lat, lon: spot.lon },
    };
  };

  const handleRouteOptionSelect = async (action: RouteAction) => {
    const selectedSpot = getSelectedSpotPoint();
    if (!selectedSpot) return;

    if (action === 'fast') {
      if (!location.loaded || !location.coordinates) {
        alert('현재 위치를 불러올 수 없어 빠른 길찾기를 사용할 수 없습니다.');
        return;
      }
      const start: RoutePoint = {
        id: 'user-loc',
        name: '내 위치',
        type: 'start',
        coordinates: location.coordinates,
      };
      const end: RoutePoint = {
        ...selectedSpot,
        type: 'end',
      };
      setStartPoint(start);
      setEndPoint(end);
      setWayPoints([]);
      // Should trigger effect
    } else if (action === 'start') {
      setStartPoint({ ...selectedSpot, type: 'start' });
    } else if (action === 'end') {
      // If there's already an end point, convert it to waypoint first
      if (endPoint) {
        // Only convert if it's a different location
        if (
          endPoint.coordinates.lat !== selectedSpot.coordinates.lat ||
          endPoint.coordinates.lon !== selectedSpot.coordinates.lon
        ) {
          convertEndToWaypoint();
        }
      }
      setEndPoint({ ...selectedSpot, type: 'end' });
    } else if (action === 'waypoint') {
      addWayPoint({
        ...selectedSpot,
        type: 'waypoint',
        id: `wp-${Date.now()}`,
      });
    }
  };

  // Manual route recalculation
  const handleManualRouteSearch = useCallback(() => {
    if (startPoint && endPoint) {
      calculateRoute(startPoint, endPoint, wayPoints);
    }
  }, [startPoint, endPoint, wayPoints, calculateRoute]);

  const isRoutingMode = !!(startPoint || endPoint || wayPoints.length > 0);

  // Derive Active Spot for BottomNavigation
  // If isFavoritesMode is toggled, displaySpots is favorites. focusedSpotIndex relies on it.
  const activeSpot =
    isMapMode && displaySpots[focusedSpotIndex]
      ? displaySpots[focusedSpotIndex]
      : null;

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-white font-jeju">
      {isFetching && <LoadingScreen />}
      <div className="absolute inset-0 z-0">
        <BackgroundMap
          spots={displaySpots || []}
          currentSpotIndex={focusedSpotIndex}
          isMapMode={isMapMode}
          isRoutingMode={isRoutingMode}
          onMapInteraction={() => {
            if (!isMapMode) setMapMode(true);
          }}
          onMarkerClick={handleMarkerClick}
          userLocation={location.coordinates}
          centerLocation={effectiveCoordinates}
          savedLocations={savedLocations}
          routeStart={startPoint?.coordinates}
          routeEnd={endPoint?.coordinates}
          routeWaypoints={wayPoints.map((w) => w.coordinates)}
          routePath={routePath || undefined}
          markerTheme={isDarkMode ? 'green' : 'orange'}
          onReferenceMarkerClick={useCallback(() => {
            const { setActiveTab } = useBottomFilterStore.getState();
            setActiveTab('chat');
          }, [])}
          onOtherMarkerClick={useCallback((coords: Coordinates) => {
            setPopupTargetCoords(coords);
            setPopupType('set-ref');
          }, [])}
          onReferenceMarkerDragEnd={useCallback(
            (lat: number, lon: number) => {
              setManualLocation({ lat, lon });
              addNotification('기준 위치를 이동했습니다.');
            },
            [setManualLocation, addNotification]
          )}
        />
      </div>

      {/* Popups Overlay Layer */}
      <AnimatePresence>
        {popupType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none"
          >
            {/* Set Reference Popup */}
            {popupType === 'set-ref' && popupTargetCoords && (
              <motion.div
                initial={{ scale: 0.8, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 10, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-6 w-80 text-center pointer-events-auto border border-gray-100 flex flex-col items-center gap-3 relative"
              >
                <button
                  onClick={() => setPopupType(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
                <h3 className="font-bold text-lg text-gray-800 mt-2">
                  기준 위치 설정
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  이 위치를 새로운 기준 위치로
                  <br />
                  설정하시겠습니까?
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setPopupType(null)}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    아니오
                  </button>
                  <button
                    onClick={() => {
                      setManualLocation(popupTargetCoords);
                      setPopupType(null);
                      addNotification('기준 위치가 변경되었습니다.');
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md active:scale-95 transition-all ${mainColorClass}`}
                  >
                    예
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center">
        <div className="w-full h-full flex flex-col relative">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="pointer-events-auto z-50">
              <AppNotification
                items={notifications.map((n) => ({
                  type: 'info',
                  content: n.content,
                  id: n.id,
                  onDismiss: () => removeNotification(n.id),
                }))}
              />
            </div>
          )}
          {/* Fallback Message */}
          {isFallback && (
            <div className="absolute top-44 left-0 right-0 z-40 px-6 animate-fade-in flex justify-center pointer-events-none">
              <button
                onClick={handleAutoFixFilters}
                className={`pointer-events-auto flex flex-col items-center justify-center p-4 rounded-2xl shadow-xl border border-white/20 text-center transition-all active:scale-95 group overflow-hidden relative ${
                  isDarkMode ? 'bg-ormi-green-500' : 'bg-orange-500'
                }`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-sm font-bold text-white mb-1 drop-shadow-sm">
                  조건에 맞는 관광지가 없습니다.
                </p>
                <p className="text-[13px] text-white/90 leading-snug font-medium">
                  일부 조건을 만족하는 다른 관광지를 둘러보시겠어요?
                </p>
              </button>
            </div>
          )}
          {/* Floating Top Navigation */}
          <div
            className={`absolute top-6 w-full px-2 md:px-6 z-[60] flex items-start justify-between gap-2 pointer-events-none transition-all duration-500 ease-in-out ${
              isRoutingMode && isMapMode
                ? '-translate-y-full opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="pointer-events-auto flex-1 min-w-0 w-full mx-auto z-40">
              <div
                className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full px-2 py-2 shadow-xl border border-gray-100 w-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pointer-events-auto shrink-0 z-50 transition-all duration-300 w-auto opacity-100">
                  <CategoryFilter />
                </div>
                <div className="hidden md:block h-6 w-px bg-gray-200 mx-1 shrink-0" />
                <div className="flex-1 min-w-0 flex justify-start overflow-hidden">
                  <GeoLocation
                    coordinates={effectiveCoordinates}
                    onLocationChange={handleLocationChange}
                    onUserClick={() => navigate({ to: '/user-info' })}
                    user={profile}
                    compact={true}
                  />
                </div>
                {/* Removed LocationManager */}
                <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />
                <div className="shrink-0 flex justify-center">
                  <WeatherWidget coordinates={effectiveCoordinates} />
                </div>
                <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />
                <div className="shrink-0">
                  <ModeToggle />
                </div>
                <div className="hidden md:block h-6 w-px bg-gray-200 mx-1 shrink-0" />
                <div className="pointer-events-auto shrink-0 z-50 ml-auto transition-all duration-300 w-auto opacity-100">
                  <BarrierFreeFilter />
                </div>
              </div>
            </div>
          </div>

          {/* Route Navigation Header */}
          {isRoutingMode && isMapMode && (
            <div className="absolute top-4 left-0 right-0 z-50 px-4 animate-slide-down pointer-events-auto">
              <RouteNavigation
                isDogMode={isDarkMode}
                userLocation={location.coordinates}
                onSearch={() => {
                  if (!endPoint) return;
                  const { name, coordinates } = endPoint;
                  const url = `tmap://route?goalname=${encodeURIComponent(
                    name
                  )}&goalx=${coordinates.lon}&goaly=${coordinates.lat}`;
                  window.location.href = url;
                }}
                onManualSearch={handleManualRouteSearch}
              />
            </div>
          )}

          {/* Bottom Navigation */}
          <BottomNavigation
            activeSpot={activeSpot}
            onSpotClose={() => setFocusedSpotIndex(-1)}
            onViewSpotDetails={(_spot: SpotCard) => {
              setMapMode(false); // To Card View
            }}
            onRouteSelect={handleRouteOptionSelect}
            currentLocation={location.coordinates}
            distanceToSpot={
              activeSpot && effectiveCoordinates
                ? getDistanceFromLatLonInMeters(
                    effectiveCoordinates.lat,
                    effectiveCoordinates.lon,
                    activeSpot.lat,
                    activeSpot.lon
                  )
                : undefined
            }
            hasStart={!!startPoint}
            hasEnd={!!endPoint}
            onSelectCurrentLocation={() => setManualLocation(null)}
            onLocationSelect={(loc: SavedLocation) =>
              setManualLocation(loc.coordinates)
            }
          />

          <OnboardingOverlay
            isVisible={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />

          {/* Card List (Overlay) when NOT in Map Mode */}
          <div className="flex-1 flex flex-col justify-end min-h-0 pointer-events-none">
            <AnimatePresence mode="wait">
              {!isMapMode && (
                <motion.div
                  key="card-list-container"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: 200,
                    y: 200,
                    scale: 0.9,
                    transition: { duration: 0.4, ease: 'easeIn' },
                  }}
                  className="w-full h-full md:w-[380px] md:absolute md:left-0 md:top-0 md:bottom-0 md:z-30 flex flex-col relative z-20 pointer-events-auto"
                >
                  {displaySpots.length === 0 && !isFetching ? (
                    <div className="mt-auto mx-4 text-jeju-light-text-disabled p-8 text-center bg-white/90 backdrop-blur rounded-3xl shadow-sm border border-jeju-light-divider mb-20">
                      {isFavoritesMode
                        ? '찜한 장소가 없습니다.'
                        : '표시할 장소가 없습니다.'}
                    </div>
                  ) : (
                    <SwipeableCardList
                      items={displaySpots}
                      userLocation={
                        location.loaded ? effectiveCoordinates : undefined
                      }
                      onIndexChange={(index) => setFocusedSpotIndex(index)}
                      onToggleMapMode={() => setMapMode(true)}
                      onLoadMore={() => {
                        /* Pagination not supported */
                      }}
                      selectedIndex={
                        focusedSpotIndex === -1 ? 0 : focusedSpotIndex
                      }
                      onNavigate={() => {
                        setMapMode(true);
                      }}
                    />
                  )}

                  {isFetching && displaySpots.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm z-50">
                      Loading...
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
