import { fetchRoute } from '@/api/tmapRoute';
import BackgroundMap from '@/components/BackgroundMap';
import BarrierFreeFilter from '@/components/BarrierFreeFilter';
import BottomNavigation, {
  type RouteAction,
} from '@/components/BottomNavigation';
import CategoryFilter from '@/components/CategoryFilter';
import GeoLocation from '@/components/GeoLocation';
import LoadingScreen from '@/components/LoadingScreen';
import ModeToggle from '@/components/ModeToggle';
import AppNotification from '@/components/Notification';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import ProtectedRoute from '@/components/ProtectedRoute';
import RouteNavigation from '@/components/RouteNavigation';
import SwipeableCardList from '@/components/SwipeableCardList';
import WeatherWidget from '@/components/WeatherWidget';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAuth } from '@/hooks/useAuth';
import useGeoLocation from '@/hooks/useGeoLocation';
import { SPOT_QUERY } from '@/queries/spotQuery';
import { useBottomFilterStore } from '@/store/bottomFilterStore';
import { useFilterStore } from '@/store/filterStore';
import { useMapStore } from '@/store/mapStore';
import { useUserStore } from '@/store/userStore';
import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';
import type { AccessibilityType } from '@/types/spot';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
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

  // Global State
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
    startPoint,
    endPoint,
    wayPoints,
    routePath,
    setRoutePath,
    routeSummary,
    setRouteSummary,
    setStartPoint,
    setEndPoint,
    setWayPoints,
    resetRoute,
    addSavedLocation,
    savedLocations,
  } = useMapStore();

  const {
    selectedCategoryIds,
    selectedBarrierIds,
    setSelectedCategoryIds,
    setSelectedBarrierIds,
    closeAllMenus,
  } = useFilterStore();

  const isDarkMode = mode === 'pet';

  // --- Favorites Mode State ---
  const { isFavoritesMode, setFavoritesMode } = useBottomFilterStore();
  const [favorites, setFavorites] = useState<any[]>([]);

  // Fetch favorites when entering favorites mode
  useEffect(() => {
    if (isFavoritesMode) {
      import('@/api/favorites').then(({ FavoritesAPI }) => {
        FavoritesAPI.getFavorites({ user_id: TEMP_USER_ID }).then((res) => {
          setFavorites(res.data || []);
        });
      });
    }
  }, [isFavoritesMode]);

  const effectiveCoordinates = manualLocation || location.coordinates;

  // Use TanStack Query for Spots
  const spotRequest = useMemo(
    () => ({
      user_id: TEMP_USER_ID,
      mapx: effectiveCoordinates?.lon || 0,
      mapy: effectiveCoordinates?.lat || 0,
      filter_type: selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
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
      const validSpots = recommendedSpots.filter((spot) => {
        const invalidPrefix = 'https://blogthumb.pstatic.net/';
        const isFirstInvalid =
          spot.first_image && spot.first_image.startsWith(invalidPrefix);
        const isSecondInvalid =
          spot.second_image && spot.second_image.startsWith(invalidPrefix);
        return !isFirstInvalid && !isSecondInvalid;
      });
      setAllSpots(validSpots);
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
    const ratedSpots = allSpots.map((spot: any) => {
      const matchedFilters = selectedBarrierIds.filter((f) => {
        const val = spot[f as keyof typeof spot];
        return typeof val === 'string' && val.trim() !== '';
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
    const filtered = allSpots.filter((spot: any) => {
      return selectedBarrierIds.every((filter: AccessibilityType) => {
        const val = spot[filter];
        return val && val.trim() !== '';
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

  // Route Logic
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

  const calculateRoute = async (
    start: RoutePoint,
    end: RoutePoint,
    ways: RoutePoint[]
  ) => {
    try {
      const passList = ways
        .filter((w) => {
          const isStart =
            Math.abs(w.coordinates.lat - start.coordinates.lat) < 0.0001 &&
            Math.abs(w.coordinates.lon - start.coordinates.lon) < 0.0001;
          const isEnd =
            Math.abs(w.coordinates.lat - end.coordinates.lat) < 0.0001 &&
            Math.abs(w.coordinates.lon - end.coordinates.lon) < 0.0001;
          return !isStart && !isEnd;
        })
        .map(
          (w) =>
            `${w.coordinates.lon.toFixed(7)},${w.coordinates.lat.toFixed(7)}`
        )
        .join('_');

      const res = await fetchRoute({
        startX: start.coordinates.lon,
        startY: start.coordinates.lat,
        endX: end.coordinates.lon,
        endY: end.coordinates.lat,
        passList: passList || undefined,
      });

      const path: Coordinates[] = [];
      res.features.forEach((feature) => {
        if (feature.geometry.type === 'LineString') {
          const coords = feature.geometry.coordinates as [number, number][];
          coords.forEach((c) => path.push({ lon: c[0], lat: c[1] }));
        }
      });
      setRoutePath(path);

      const props = res.features[0].properties;
      if (props.totalTime || props.totalDistance) {
        setRouteSummary({
          time: props.totalTime || 0,
          distance: props.totalDistance || 0,
        });
      } else {
        setRouteSummary(null);
      }
    } catch (e) {
      console.error('Route Error:', e);
      alert('길찾기 경로를 계산할 수 없습니다.');
    }
  };

  // Re-calculate when points change
  useEffect(() => {
    if (startPoint && endPoint) {
      calculateRoute(startPoint, endPoint, wayPoints);
    } else {
      setRoutePath(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPoint, endPoint, wayPoints]);

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
      if (endPoint) {
        const oldEndAsWaypoint: RoutePoint = {
          ...endPoint,
          type: 'waypoint',
          id: `wp-from-end-${Date.now()}`,
        };
        if (
          endPoint.coordinates.lat !== selectedSpot.coordinates.lat ||
          endPoint.coordinates.lon !== selectedSpot.coordinates.lon
        ) {
          setWayPoints((prev) => [...prev, oldEndAsWaypoint]);
        }
      }
      setEndPoint({ ...selectedSpot, type: 'end' });
    } else if (action === 'waypoint') {
      setWayPoints((prev) => [
        ...prev,
        { ...selectedSpot, type: 'waypoint', id: `wp-${Date.now()}` },
      ]);
    }
  };

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
      <BackgroundMap
        spots={displaySpots || []}
        currentSpotIndex={focusedSpotIndex}
        isMapMode={isMapMode}
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
      />

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
            className={`absolute top-6 w-full px-2 md:px-6 z-30 flex items-start justify-between gap-2 pointer-events-none transition-all duration-500 ease-in-out ${
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
                startPoint={startPoint}
                endPoint={endPoint}
                wayPoints={wayPoints}
                summary={routeSummary}
                onWaypointsChange={setWayPoints}
                isDogMode={isDarkMode}
                onSetStartToMyLoc={() => {
                  if (location.coordinates) {
                    setStartPoint({
                      id: 'user-loc',
                      name: '내 위치',
                      type: 'start',
                      coordinates: location.coordinates,
                    });
                  } else {
                    alert('현재 위치를 가져올 수 없습니다.');
                  }
                }}
                onRemovePoint={(id) => {
                  if (startPoint?.id === id) setStartPoint(null);
                  else if (endPoint?.id === id) setEndPoint(null);
                  else
                    setWayPoints((w: RoutePoint[]) =>
                      w.filter((p) => p.id !== id)
                    );
                }}
                onSearch={() => {
                  if (!endPoint) return;
                  const { name, coordinates } = endPoint;
                  const url = `tmap://route?goalname=${encodeURIComponent(
                    name
                  )}&goalx=${coordinates.lon}&goaly=${coordinates.lat}`;
                  window.location.href = url;
                }}
                onReset={resetRoute}
              />
            </div>
          )}

          {/* Bottom Navigation */}
          <BottomNavigation
            activeSpot={activeSpot}
            onSpotClose={() => setFocusedSpotIndex(-1)}
            onViewSpotDetails={(spot: any) => {
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
            onLocationSelect={(loc: any) => setManualLocation(loc.coordinates)}
          />

          <OnboardingOverlay
            isVisible={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />

          {/* Card List (Overlay) when NOT in Map Mode */}
          <div
            className={`flex-1 flex flex-col justify-end min-h-0 ${isMapMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
            onClick={() => {
              if (!isMapMode) setMapMode(true);
            }}
          >
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
