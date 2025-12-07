import CategoryFilter from '@/components/CategoryFilter';
import GeoLocation from '@/components/GeoLocation';
import AppNotification from '@/components/Notification';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import ProtectedRoute from '@/components/ProtectedRoute';
import SwipeableCardList from '@/components/SwipeableCardList';
import WeatherWidget from '@/components/WeatherWidget';
import { MOCK_SPOTS } from '@/data/spots';
import { useAuth } from '@/hooks/useAuth';
import useGeoLocation from '@/hooks/useGeoLocation';
import type { Coordinates } from '@/types/geo';
import { SpotCategory } from '@/types/spot';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  return (
    <ProtectedRoute>
      <IndexPageContent />
    </ProtectedRoute>
  );
}

function IndexPageContent() {
  const navigate = useNavigate();
  const location = useGeoLocation();
  const { profile } = useAuth(); // Get profile
  const [manualLocation, setManualLocation] = useState<Coordinates | null>(
    null
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; content: string }>
  >([]);

  const [selectedCategories, setSelectedCategories] = useState<SpotCategory[]>([
    SpotCategory.LANDMARK,
    SpotCategory.CAFE,
    SpotCategory.DINNER,
  ]);

  const filteredSpots = MOCK_SPOTS.filter((spot) =>
    selectedCategories.includes(spot.category)
  );

  const effectiveCoordinates = manualLocation || location.coordinates;

  const handleLocationChange = (coords: Coordinates) => {
    setManualLocation(coords);
    // Optional: Notify user
    const id = Date.now().toString();
    setNotifications((prev) => [
      ...prev,
      { id, content: '위치가 변경되었습니다.' },
    ]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-4 px-4 pb-4 md:px-6 md:py-8 bg-jeju-light-background dark:bg-jeju-dark-background relative overflow-hidden text-jeju-light-text-primary dark:text-jeju-dark-text-primary">
      <div className="text-center w-full max-w-lg md:max-w-2xl transition-all duration-300 flex flex-col h-full">
        {/* Global Notification */}
        {notifications.length > 0 && (
          <AppNotification
            items={notifications.map((n) => ({
              type: 'info',
              content: n.content,
              id: n.id,
              onDismiss: () =>
                setNotifications((prev) => prev.filter((x) => x.id !== n.id)),
            }))}
          />
        )}

        {/* Geo & Weather Section - Compact */}
        {location.loaded && (
          <div className="mb-2 animate-fade-in shrink-0">
            {/* Header: Location & User Actions */}
            <GeoLocation
              coordinates={effectiveCoordinates}
              onLocationChange={handleLocationChange}
              onHelpClick={() => setShowOnboarding(true)}
              onUserClick={() => navigate({ to: '/user' })}
              user={profile}
            />

            {/* Weather Section */}
            <div className="mt-1 w-full">
              <WeatherWidget coordinates={effectiveCoordinates} />
            </div>

            {/* Category Filter - Compact */}
            <div className="mt-2 mb-2">
              <CategoryFilter
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
            </div>
          </div>
        )}

        <OnboardingOverlay
          isVisible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />

        <div className="flex-1 flex items-center justify-center min-h-0">
          <SwipeableCardList
            items={filteredSpots}
            userLocation={location.loaded ? effectiveCoordinates : undefined}
          />
        </div>
      </div>
    </div>
  );
}
