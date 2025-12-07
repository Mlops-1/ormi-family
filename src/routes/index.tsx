import CategoryFilter from '@/components/CategoryFilter';
import GeoLocation from '@/components/GeoLocation';
import AppNotification from '@/components/Notification';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import SwipeableCardList from '@/components/SwipeableCardList';
import WeatherWidget from '@/components/WeatherWidget';
import { MOCK_SPOTS } from '@/data/spots';
import useGeoLocation from '@/hooks/useGeoLocation';
import { SpotCategory } from '@/types/spot';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  const location = useGeoLocation();
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

  const handleGeoClick = () => {
    const id = Date.now().toString();
    const lat = location.coordinates.lat.toFixed(4);
    const lon = location.coordinates.lon.toFixed(4);

    // Provide feedback on source
    const sourceInfo = location.isFallback ? ' (기본 위치)' : ' (GPS)';
    const errorInfo = location.error ? ` - ${location.error.message}` : '';

    setNotifications((prev) => [
      ...prev,
      { id, content: `현재 위경도${sourceInfo}: ${lat}, ${lon}${errorInfo}` },
    ]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12 px-4 pb-8 md:px-6 md:py-12 bg-linear-to-br from-ormi-green-100 via-ormi-ember-100 to-ormi-pink-100 relative">
      <div className="text-center w-full max-w-lg md:max-w-2xl transition-all duration-300">
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

        {/* Geo & Weather Section */}
        {location.loaded && (
          <div className="mb-8 animate-fade-in">
            <GeoLocation
              coordinates={location.coordinates}
              onLocationClick={handleGeoClick}
              onHelpClick={() => setShowOnboarding(true)}
              onUserClick={() => navigate({ to: '/user' })}
            />
            <WeatherWidget coordinates={location.coordinates} />

            {/* Category Filter */}
            <div className="mt-6 mb-2">
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

        <SwipeableCardList
          items={filteredSpots}
          userLocation={location.loaded ? location.coordinates : undefined}
        />
      </div>
    </div>
  );
}
