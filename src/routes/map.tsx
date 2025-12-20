import { SpotAPI } from '@/api/spot';
import { fetchRoute } from '@/api/tmapRoute';
import BackgroundMap from '@/components/BackgroundMap';
import BarrierFreeFilter from '@/components/BarrierFreeFilter';
import CategoryFilter from '@/components/CategoryFilter';
import FavoritesBottomSheet from '@/components/FavoritesBottomSheet';
import GeoLocation from '@/components/GeoLocation';
import ModeToggle from '@/components/ModeToggle';
import AppNotification from '@/components/Notification';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import ProtectedRoute from '@/components/ProtectedRoute';
import RouteNavigation from '@/components/RouteNavigation';
import SpotInteractionSheet, {
  type RouteAction,
} from '@/components/SpotInteractionSheet';
import SwipeableCardList from '@/components/SwipeableCardList';
import WeatherWidget from '@/components/WeatherWidget';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAuth } from '@/hooks/useAuth';
import useGeoLocation from '@/hooks/useGeoLocation';
import { INITIAL_CATEGORY_IDS, useFilterStore } from '@/store/filterStore';
import { useMapStore } from '@/store/mapStore';
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
  } = useMapStore();

  const {
    selectedCategoryIds,
    selectedBarrierIds,
    setSelectedCategoryIds,
    setSelectedBarrierIds,
  } = useFilterStore();

  const [isFetching, setIsFetching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme Detection
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const effectiveCoordinates = manualLocation || location.coordinates;

  // Load Spots (Converted to work with Store)
  const loadSpots = useCallback(
    async (isReset = false) => {
      if (!effectiveCoordinates || isFetching) return;

      setIsFetching(true);
      try {
        const response = await SpotAPI.getRecommendedSpots({
          user_id: TEMP_USER_ID,
          mapx: effectiveCoordinates.lon,
          mapy: effectiveCoordinates.lat,
          filter_type:
            selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
        });

        const newSpots = response.data || [];

        setAllSpots((prev) => {
          if (isReset) return newSpots;
          const existingIds = new Set(prev.map((s) => s.content_id));
          const uniqueNew = newSpots.filter(
            (s) => !existingIds.has(s.content_id)
          );
          if (uniqueNew.length === 0) return prev;

          // Notification handled by store
          if (!isReset) {
            addNotification('새로운 추천 장소를 불러왔습니다.');
          }

          return [...prev, ...uniqueNew];
        });
      } catch (error) {
        console.error('Failed to load spots', error);
      } finally {
        setIsFetching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCoordinates, selectedCategoryIds]
  );

  useEffect(() => {
    loadSpots(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCoordinates, selectedCategoryIds]);

  // Client-side Accessibility Filter logic
  const { displaySpots, isFallback } = useMemo(() => {
    // allSpots comes from store now
    if (!allSpots) return { displaySpots: [], isFallback: false };

    let filtered = allSpots;
    if (selectedBarrierIds.length > 0) {
      filtered = allSpots.filter((spot) => {
        return selectedBarrierIds.some((filter: AccessibilityType) => {
          const val = spot[filter];
          return val && val.trim() !== '';
        });
      });
    }

    const fallback =
      filtered.length === 0 &&
      selectedBarrierIds.length > 0 &&
      allSpots.length > 0;

    return {
      displaySpots: fallback ? allSpots : filtered,
      isFallback: fallback,
    };
  }, [allSpots, selectedBarrierIds]);

  const handleLocationChange = (coords: Coordinates) => {
    setManualLocation(coords);
    addNotification('위치가 변경되었습니다.');
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

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-gray-100 dark:bg-gray-900">
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
          {isFallback && !isMapMode && (
            <div className="absolute top-44 left-0 right-0 z-40 px-4 animate-fade-in pointer-events-none">
              <div className="bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm text-center">
                <p className="font-bold">조건에 맞는 관광지가 없습니다.</p>
                <p className="text-sm opacity-90">대신 이 곳들은 어떠세요?</p>
              </div>
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
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full px-2 py-2 shadow-xl border border-gray-100 w-full relative">
                <div className="pointer-events-auto shrink-0 z-50 transition-all duration-300 w-auto opacity-100">
                  <CategoryFilter />
                </div>
                <div className="hidden md:block h-6 w-px bg-gray-200 mx-1 shrink-0" />
                <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
                  <GeoLocation
                    coordinates={effectiveCoordinates}
                    onLocationChange={handleLocationChange}
                    onUserClick={() => navigate({ to: '/user-info' })}
                    user={profile}
                    compact={true}
                  />
                </div>
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
          {/* Side Piano Keys Removed as per user request */}
          {/* Spot Interaction Sheet */}
          {isMapMode && displaySpots[focusedSpotIndex] && (
            <div className="pointer-events-auto">
              <SpotInteractionSheet
                spot={displaySpots[focusedSpotIndex]}
                distance={
                  effectiveCoordinates
                    ? getDistanceFromLatLonInMeters(
                        effectiveCoordinates.lat,
                        effectiveCoordinates.lon,
                        displaySpots[focusedSpotIndex].lat,
                        displaySpots[focusedSpotIndex].lon
                      )
                    : undefined
                }
                markerTheme={isDarkMode ? 'green' : 'orange'}
                onClose={() => setFocusedSpotIndex(-1)}
                onViewCard={() => setMapMode(false)}
                onRouteSelect={handleRouteOptionSelect}
                hasStart={!!startPoint}
                hasEnd={!!endPoint}
              />
            </div>
          )}
          {/* Route Navigation Header - Needs extraction ideally, but keeping inline for logic proximity unless forced */}
          {isRoutingMode && isMapMode && (
            <div className="absolute top-4 left-0 right-0 z-50 px-4 animate-slide-down pointer-events-auto">
              <RouteNavigation
                startPoint={startPoint}
                endPoint={endPoint}
                wayPoints={wayPoints}
                summary={routeSummary}
                onWaypointsChange={setWayPoints}
                isDogMode={document.documentElement.classList.contains('dark')}
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
          <FavoritesBottomSheet
            onSpotClick={(spot) => {
              let updatedAllSpots = allSpots;
              const exists = allSpots.find(
                (s) => s.content_id === spot.content_id
              );
              if (!exists) {
                // If adding from favs, update store
                setAllSpots((prev) => [spot, ...prev]);
                updatedAllSpots = [spot, ...allSpots];
              }

              setSelectedCategoryIds(INITIAL_CATEGORY_IDS);
              setSelectedBarrierIds([]);
              setMapMode(false);

              const idx = updatedAllSpots.findIndex(
                (s) => s.content_id === spot.content_id
              );
              setFocusedSpotIndex(idx !== -1 ? idx : 0);
            }}
          />
          <OnboardingOverlay
            isVisible={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />
          <div
            className={`flex-1 flex flex-col justify-end min-h-0 ${isMapMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
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
                  className="w-full h-full md:w-[380px] md:h-[calc(100vh-2rem)] md:fixed md:left-4 md:top-4 md:z-30 md:rounded-3xl md:overflow-hidden flex flex-col relative z-20 pointer-events-none"
                >
                  {displaySpots.length === 0 && !isFetching ? (
                    <div className="mt-auto mx-4 text-jeju-light-text-disabled dark:text-jeju-dark-text-disabled p-8 text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-3xl shadow-sm border border-jeju-light-divider dark:border-jeju-dark-divider">
                      표시할 장소가 없습니다.
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
                        if (!isFetching) loadSpots(false);
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
                      추가 장소 로딩 중...
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
