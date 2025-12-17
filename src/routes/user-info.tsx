import { FavoritesAPI } from '@/api/favorites';
import Logo from '@/components/Logo';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, UserCog } from 'lucide-react';
import { useState } from 'react';

// Cloudscape Imports
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';

export const Route = createFileRoute('/user-info')({
  component: UserInfoPage,
});

function UserInfoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analytics = useAnalytics();

  // Mock lat/lon (Jeju City)
  const lat = 33.4996;
  const lon = 126.5312;

  // Selected item for modal
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', 'user-1'],
    queryFn: async () => {
      // Always user 1 per requirements
      const response = await FavoritesAPI.getFavorites({
        user_id: 1,
        lat,
        lon,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: number) => {
      await FavoritesAPI.removeFavorite(contentId, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      setIsModalOpen(false);
      setSelectedSpot(null);
    },
  });

  const handleSpotClick = (contentId: number) => {
    setSelectedSpot(contentId);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedSpot) {
      deleteMutation.mutate(selectedSpot);
    }
  };

  const handleFindRoute = async () => {
    // Placeholder for route finding - open map in new tab
    // If we have the spot data, we could link to it.
    // We can find the spot in the favorites list.
    const spot = favorites?.find((s) => s.content_id === selectedSpot);
    if (spot) {
      try {
        // Track navigation analytics event
        await analytics.trackNavigation?.(
          spot.content_id.toString(),
          spot.lat,
          spot.lon
        );
      } catch (err) {
        console.error('Failed to track navigation event', err);
      }

      // Simple search link
      const url = `https://map.kakao.com/link/search/${spot.title}`;
      window.open(url, '_blank');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-jeju-light-background dark:bg-jeju-dark-background p-4 animate-fade-in pb-24">
      {/* Cloudscape Modal */}
      <Modal
        onDismiss={() => setIsModalOpen(false)}
        visible={isModalOpen}
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
            </SpaceBetween>
          </Box>
        }
        header={<Header>여행지 설정</Header>}
      >
        <SpaceBetween direction="vertical" size="m">
          <Button variant="primary" fullWidth onClick={handleFindRoute}>
            길찾기
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            찜 삭제
          </Button>
        </SpaceBetween>
      </Modal>

      <div className="max-w-md mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <button
            onClick={() => navigate({ to: '/' })}
            className="p-2 -ml-2 rounded-full hover:bg-jeju-light-surface dark:hover:bg-jeju-dark-surface text-jeju-light-text-primary dark:text-jeju-dark-text-primary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <Logo />
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* User Greeting Section */}
        <div className="bg-jeju-light-surface dark:bg-jeju-dark-surface rounded-2xl p-6 shadow-sm border border-jeju-light-divider dark:border-jeju-dark-divider mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-jeju-light-text-primary dark:text-jeju-dark-text-primary mb-1">
                {user?.attributes?.name || 'User 1'} 님 안녕하세요
              </h1>
              <p className="text-sm text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary">
                나만의 제주 여행지 보관함
              </p>
            </div>
            <button
              onClick={() => navigate({ to: '/user' })}
              className="flex flex-col items-center gap-1 text-xs text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary hover:text-jeju-light-primary dark:hover:text-jeju-light-primary transition-colors"
            >
              <div className="p-3 bg-jeju-light-background dark:bg-jeju-dark-background rounded-full">
                <UserCog size={20} />
              </div>
              프로필 수정
            </button>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-jeju-light-text-primary dark:text-jeju-dark-text-primary">
            찜한 여행지 ({favorites?.length || 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {favorites.map((spot) => (
              <div
                key={spot.content_id}
                className="group relative aspect-square rounded-md overflow-hidden cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                onClick={() => handleSpotClick(spot.content_id)}
              >
                <img
                  src={spot.second_image || spot.first_image} // Fallback to first if second missing
                  alt={spot.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary">
            <p>아직 찜한 여행지가 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
