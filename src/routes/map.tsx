import { SpotAPI } from '@/api/spot';
import BackgroundMap from '@/components/BackgroundMap';
import BarrierFreeFilter, {
  type AccessibilityType,
} from '@/components/BarrierFreeFilter';
import CategoryFilter from '@/components/CategoryFilter';
import GeoLocation from '@/components/GeoLocation';
import ModeToggle from '@/components/ModeToggle';
import AppNotification from '@/components/Notification';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import ProtectedRoute from '@/components/ProtectedRoute';
import SwipeableCardList from '@/components/SwipeableCardList';
import WeatherWidget from '@/components/WeatherWidget';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAuth } from '@/hooks/useAuth';
import useGeoLocation from '@/hooks/useGeoLocation';
import { useFilterStore } from '@/store/filterStore';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
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

  // Infinite Scroll State
  const [allSpots, setAllSpots] = useState<SpotCard[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Store Filter State
  const { selectedCategoryIds, selectedBarrierIds } = useFilterStore();

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
    // Explicitly confirm map mode exit is requested AFTER index update
    setIsMapMode(false);
  };

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
      />

      {/* Map Mode Return Button */}
      {isMapMode && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-auto">
          <button
            onClick={() => setIsMapMode(false)}
            className="bg-black/80 text-white px-6 py-3 rounded-full font-bold shadow-lg backdrop-blur flex items-center gap-2 hover:scale-105 transition-transform"
          >
            카드로 돌아가기
          </button>
        </div>
      )}

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
            className={`absolute top-6 w-full px-2 md:px-6 z-30 flex items-start justify-between gap-2 pointer-events-none transition-transform duration-500 ease-in-out ${isMapMode ? '-translate-y-48' : 'translate-y-0'}`}
          >
            {/* Centered Top Nav Info */}
            <div className="pointer-events-auto flex-1 min-w-0 max-w-3xl mx-auto z-40">
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full px-2 py-2 shadow-xl border border-gray-100 w-full relative">
                <div className="pointer-events-auto shrink-0 z-50">
                  <CategoryFilter />
                </div>

                <div className="hidden md:block h-6 w-px bg-gray-200 mx-1 shrink-0" />

                <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
                  <GeoLocation
                    coordinates={effectiveCoordinates}
                    onLocationChange={handleLocationChange}
                    onHelpClick={() => setShowOnboarding(true)}
                    onUserClick={() => navigate({ to: '/user-info' })}
                    user={profile}
                    compact={true}
                    hideUserIcon={true} // Passing new prop
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

                <div className="pointer-events-auto shrink-0 z-50">
                  <BarrierFreeFilter />
                </div>
              </div>
            </div>
          </div>

          <OnboardingOverlay
            isVisible={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />

          {/* Bottom Card Area */}
          <div
            className={`flex-1 flex flex-col justify-end pb-8 min-h-0 ${isMapMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
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
                      selectedIndex={focusedSpotIndex} // Pass this to sync card with marker
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
