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
import RouteNavigation, { type RoutePoint } from '@/components/RouteNavigation';
import SpotInteractionSheet, {
  type RouteAction,
} from '@/components/SpotInteractionSheet';
import SwipeableCardList from '@/components/SwipeableCardList';
import WeatherWidget from '@/components/WeatherWidget';
import { BARRIER_CONFIG, CATEGORY_CONFIG } from '@/constants/filterConfig';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAuth } from '@/hooks/useAuth';
import useGeoLocation from '@/hooks/useGeoLocation';
import { INITIAL_CATEGORY_IDS, useFilterStore } from '@/store/filterStore';
import type { Coordinates } from '@/types/geo';
import type { AccessibilityType, SpotCard } from '@/types/spot';
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
  const { profile } = useAuth();
  const [manualLocation, setManualLocation] = useState<Coordinates | null>(
    null
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusedSpotIndex, setFocusedSpotIndex] = useState(0);
  const [isMapMode, setIsMapMode] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; content: string }>
  >([]);

  // Routing State

  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [endPoint, setEndPoint] = useState<RoutePoint | null>(null);
  const [wayPoints, setWayPoints] = useState<RoutePoint[]>([]);
  const [routePath, setRoutePath] = useState<Coordinates[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<{
    distance: number;
    time: number;
  } | null>(null);

  // Infinite Scroll State
  const [allSpots, setAllSpots] = useState<SpotCard[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Theme State for Marker/Route Color
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Store Filter State
  const {
    selectedCategoryIds,
    selectedBarrierIds,
    setSelectedCategoryIds,
    setSelectedBarrierIds,
    categoryOrderedIds,
    barrierOrderedIds,
  } = useFilterStore();

  const effectiveCoordinates = manualLocation || location.coordinates;

  // Load Spots Function
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
          // Filter duplicates
          const existingIds = new Set(prev.map((s) => s.content_id));
          const uniqueNew = newSpots.filter(
            (s) => !existingIds.has(s.content_id)
          );
          if (uniqueNew.length === 0) return prev;

          // Notify if new spots added via scrolling
          if (!isReset) {
            const id = Date.now().toString();
            setNotifications((prevNotifs) => [
              ...prevNotifs,
              { id, content: '새로운 추천 장소를 불러왔습니다.' },
            ]);
            setTimeout(
              () =>
                setNotifications((prevNotifs) =>
                  prevNotifs.filter((n) => n.id !== id)
                ),
              2000
            );
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
    const id = Date.now().toString();
    setNotifications((prev) => [
      ...prev,
      { id, content: '위치가 변경되었습니다.' },
    ]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const handleIndexChange = (index: number) => {
    setFocusedSpotIndex(index);
  };

  const handleLoadMore = () => {
    if (!isFetching) {
      loadSpots(false);
    }
  };

  const handleMarkerClick = (index: number) => {
    setFocusedSpotIndex(index);
    // Always switch to Map Mode to show Header and Menu
    setIsMapMode(true);
  };

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.floor(d * 1000); // Meters
  };

  // Route Logic
  const getSelectedSpotPoint = (): RoutePoint | null => {
    if (!displaySpots[focusedSpotIndex]) return null;
    const spot = displaySpots[focusedSpotIndex];
    return {
      id: spot.content_id.toString(),
      name: spot.title,
      type: 'waypoint', // Default type, will change based on assignment
      coordinates: { lat: spot.lat, lon: spot.lon },
    };
  };

  const handleRouteOptionSelect = async (action: RouteAction) => {
    const selectedSpot = getSelectedSpotPoint();
    if (!selectedSpot) return;

    // Note: We don't need setShowRouteMenu anymore as the sheet closes when we initiate action or explicitly close
    // But logically, if we start routing, isRoutingMode becomes true, and the sheet might hide if we base it on !isRoutingMode

    if (action === 'fast') {
      // Fast Route: User Loc -> Selected Spot
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
      // Auto fetch triggered by effect or we call explicitly?
      // Better to trigger explicitly to be sure.
      calculateRoute(start, end, []);
    } else if (action === 'start') {
      setStartPoint({ ...selectedSpot, type: 'start' });
    } else if (action === 'end') {
      // Smart Logic: If End exists, push old End to Waypoints (Extend Trip)
      if (endPoint) {
        const oldEndAsWaypoint: RoutePoint = {
          ...endPoint,
          type: 'waypoint',
          id: `wp-from-end-${Date.now()}`,
        };
        // Avoid duplicates if user clicks same spot
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

  const calculateRoute = async (
    start: RoutePoint,
    end: RoutePoint,
    ways: RoutePoint[]
  ) => {
    try {
      const passList = ways
        .filter((w) => {
          // Filter out waypoints that are effectively start or end to prevent loops
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

      // Extract Summary (Time/Distance)
      const props = res.features[0].properties;
      if (props.totalTime || props.totalDistance) {
        setRouteSummary({
          time: props.totalTime || 0, // seconds
          distance: props.totalDistance || 0, // meters
        });
      } else {
        setRouteSummary(null);
      }
    } catch (e) {
      console.error('Route Error:', e);
      alert('길찾기 경로를 계산할 수 없습니다.');
    }
  };

  // Re-calculate when points change (Requirement 9)
  useEffect(() => {
    if (startPoint && endPoint) {
      calculateRoute(startPoint, endPoint, wayPoints);
    } else {
      setRoutePath(null);
    }
  }, [startPoint, endPoint, wayPoints]);

  const handleResetRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setWayPoints([]);
    setRoutePath(null);
    setRouteSummary(null);
  };

  const isRoutingMode = !!(startPoint || endPoint || wayPoints.length > 0);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Background Map - Updated with User & Center Location */}
      <BackgroundMap
        spots={displaySpots || []}
        currentSpotIndex={focusedSpotIndex}
        isMapMode={isMapMode}
        onMapInteraction={() => {
          // Only enable map mode if not already active to avoid fighting with marker click
          if (!isMapMode) setIsMapMode(true);
        }}
        onMarkerClick={handleMarkerClick}
        userLocation={location.coordinates}
        centerLocation={effectiveCoordinates}
        // Route Props
        routeStart={startPoint?.coordinates}
        routeEnd={endPoint?.coordinates}
        routeWaypoints={wayPoints.map((w) => w.coordinates)}
        routePath={routePath || undefined}
        markerTheme={isDarkMode ? 'green' : 'orange'}
      />

      {/* Map Mode Return Button - Show only if Sheet is NOT visible to avoid overlap/redundancy */}

      {/* Overlay Content */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center">
        <div className="w-full max-w-lg md:max-w-xl h-full flex flex-col relative">
          {/* Global Notification */}
          {notifications.length > 0 && (
            <div className="pointer-events-auto z-50">
              <AppNotification
                items={notifications.map((n) => ({
                  type: 'info',
                  content: n.content,
                  id: n.id,
                  onDismiss: () =>
                    setNotifications((prev) =>
                      prev.filter((x) => x.id !== n.id)
                    ),
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
              // Hide ONLY if Routing Mode (User wants Weather visible in Map Mode)
              isRoutingMode
                ? '-translate-y-full opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            {/* Centered Top Nav Info */}
            <div className="pointer-events-auto flex-1 min-w-0 max-w-3xl mx-auto z-40">
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full px-2 py-2 shadow-xl border border-gray-100 w-full relative">
                <div
                  className={`pointer-events-auto shrink-0 z-50 transition-all duration-300 ${isMapMode ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}`}
                >
                  <CategoryFilter />
                </div>

                {/* GeoLocation: Always visible */}
                <div
                  className={`hidden md:block h-6 w-px bg-gray-200 mx-1 shrink-0 ${isMapMode ? 'opacity-0' : ''}`}
                />

                <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
                  <GeoLocation
                    coordinates={effectiveCoordinates}
                    onLocationChange={handleLocationChange}
                    onHelpClick={() => setShowOnboarding(true)}
                    onUserClick={() => navigate({ to: '/user-info' })}
                    user={profile}
                    compact={true}
                  />
                </div>

                {/* Weather & Mode: Always Visible (restored) */}
                <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />

                <div className="shrink-0 flex justify-center">
                  <WeatherWidget coordinates={effectiveCoordinates} />
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />

                <div className="shrink-0">
                  <ModeToggle />
                </div>

                <div className="hidden md:block h-6 w-px bg-gray-200 mx-1 shrink-0" />

                <div
                  className={`pointer-events-auto shrink-0 z-50 ml-auto transition-all duration-300 ${isMapMode ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}`}
                >
                  <BarrierFreeFilter />
                </div>
              </div>
            </div>
          </div>

          {/* Side Piano Key Filters (Visible only in Map Mode & Not Routing) */}
          {isMapMode && !isRoutingMode && (
            <>
              {/* Left Side: Category Config */}
              <div className="absolute top-28 left-0 z-40 flex flex-col gap-3 pointer-events-auto">
                {categoryOrderedIds.map((id) => {
                  const config = CATEGORY_CONFIG[id];
                  const isActive = selectedCategoryIds.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() =>
                        setSelectedCategoryIds(
                          isActive
                            ? selectedCategoryIds.filter((cid) => cid !== id)
                            : [...selectedCategoryIds, id]
                        )
                      }
                      className={`flex items-center gap-2 pl-4 pr-3 py-3 rounded-r-2xl shadow-md transition-all duration-300 ${
                        isActive
                          ? 'bg-orange-500 dark:bg-ormi-green-600 text-white translate-x-0'
                          : 'bg-white text-gray-400 -translate-x-1 hover:translate-x-0'
                      }`}
                    >
                      <span className="shrink-0">{config.icon}</span>
                      <span className="font-bold text-sm hidden md:block whitespace-nowrap">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Barrier Config */}
              <div className="absolute top-28 right-0 z-40 flex flex-col gap-3 pointer-events-auto">
                {barrierOrderedIds.map((id) => {
                  const config = BARRIER_CONFIG[id];
                  const isActive = selectedBarrierIds.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() =>
                        setSelectedBarrierIds(
                          isActive
                            ? selectedBarrierIds.filter((bid) => bid !== id)
                            : [...selectedBarrierIds, id]
                        )
                      }
                      className={`flex items-center gap-2 pr-4 pl-3 py-3 rounded-l-2xl shadow-md transition-all duration-300 ${
                        isActive
                          ? 'bg-orange-500 dark:bg-ormi-green-600 text-white translate-x-0'
                          : 'bg-white text-gray-400 translate-x-1 hover:translate-x-0'
                      }`}
                    >
                      {/* Icon only on Mobile, Label on Desktop or nice layout? 
                          Image 1 shows Icons only (stacked).
                          Let's stick to Icons to save space on mobile map. */}
                      <span className="shrink-0">{config.icon}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Spot Interaction Sheet (Combined Header & Route Menu) */}
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
                onClose={() => {
                  setFocusedSpotIndex(-1);
                }}
                onViewCard={() => setIsMapMode(false)}
                onRouteSelect={handleRouteOptionSelect}
                hasStart={!!startPoint}
                hasEnd={!!endPoint}
              />
            </div>
          )}

          {/* Route Navigation Header (Overlay) */}
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
                  else setWayPoints((w) => w.filter((p) => p.id !== id));
                }}
                onSearch={() => {
                  if (!endPoint) return;
                  const { name, coordinates } = endPoint;
                  // Tmap Deep Link Scheme
                  // Using simplistic URL scheme for mobile/web fallback
                  // tmap://route?goalname={name}&goalx={lon}&goaly={lat}
                  const url = `tmap://route?goalname=${encodeURIComponent(
                    name
                  )}&goalx=${coordinates.lon}&goaly=${coordinates.lat}`;

                  // Fallback to store or web if needed (basic implementation)
                  window.location.href = url;

                  // For better UX, arguably we could verify installation, but for this web app,
                  // triggering the scheme is standard.
                  // If failing, maybe open a new window to Tmap web?
                  // Let's safe-guard with a timeout fallback or just allow browser handling.
                  setTimeout(() => {
                    // Fallback logic if needed, e.g. App Store
                  }, 500);
                }}
                onReset={handleResetRoute}
              />
            </div>
          )}

          <FavoritesBottomSheet
            onSpotClick={(spot) => {
              // 1. Ensure spot is in allSpots
              let updatedAllSpots = allSpots;
              const exists = allSpots.find(
                (s) => s.content_id === spot.content_id
              );
              if (!exists) {
                updatedAllSpots = [spot, ...allSpots];
                setAllSpots(updatedAllSpots);
              }

              // 2. Reset Filters to ensure spot shows up
              setSelectedCategoryIds(INITIAL_CATEGORY_IDS);
              setSelectedBarrierIds([]);

              // 3. Switch Mode
              setIsMapMode(false);

              // 4. Set Focus Index
              // Since filters are reset, displaySpots will eventually equal allSpots (filtered by barrier).
              // We need to find the index of this spot in the new list.
              // Logic: displaySpots updates next render.
              // For now, we set index based on current knowledge or force 0 if we prepended.
              // A safer way is to rely on content_id matching, but SwipeableCardList takes numeric index.
              // If we just added it to the TOP, it's 0.
              // If it existed, we need to find it.
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

          {/* Bottom Card Area */}
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
                  className="w-full h-full flex flex-col relative z-20"
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
                      onIndexChange={handleIndexChange}
                      onToggleMapMode={() => setIsMapMode(true)}
                      onLoadMore={handleLoadMore}
                      selectedIndex={
                        focusedSpotIndex === -1 ? 0 : focusedSpotIndex
                      } // Handle -1 case
                      onNavigate={() => {
                        setIsMapMode(true);
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
