import { FavoritesAPI } from '@/api/favorites';
import { UserAPI } from '@/api/user'; // Import UserAPI
import fallbackImage from '@/assets/images/fallback_spot.jpg';
import Logo from '@/components/common/Logo';

import { TEMP_USER_ID } from '@/constants/temp_user';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Baby, PawPrint, ShoppingCart, UserCog } from 'lucide-react'; // Added Icons
import { useState } from 'react';

// Cloudscape Imports

import SpotDetailModal from '@/components/view/SpotDetailModal';
export const Route = createFileRoute('/user-info')({
  component: UserInfoPage,
});

function UserInfoPage() {
  const navigate = useNavigate();

  // Mock lat/lon (Jeju City)
  const lat = 33.4996;
  const lon = 126.5312;

  // Selected item for modal
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);

  // Fetch User Info
  const { data: userInfo, isLoading: isUserLoading } = useQuery({
    queryKey: ['userInfo', TEMP_USER_ID],
    queryFn: async () => {
      const response = await UserAPI.getUserInfo(TEMP_USER_ID);
      // Backend returns an array, use the first item
      return Array.isArray(response.data) ? response.data[0] : response.data;
    },
  });

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', TEMP_USER_ID],
    queryFn: async () => {
      const response = await FavoritesAPI.getFavorites({
        user_id: TEMP_USER_ID,
        lat,
        lon,
      });
      return response.data;
    },
  });

  const handleSpotClick = (contentId: number) => {
    setSelectedSpot(contentId);
  };

  const handleCloseDetail = () => {
    setSelectedSpot(null);
  };

  const getUserDisplayName = () => {
    if (
      typeof userInfo?.user_name === 'string' &&
      userInfo.user_name.trim() !== ''
    ) {
      return userInfo.user_name;
    }
    return `유저 ${userInfo?.user_id || TEMP_USER_ID}`;
  };

  return (
    <div className="min-h-screen bg-jeju-light-background dark:bg-jeju-dark-background p-4 animate-fade-in pb-24">
      {selectedSpot && favorites && (
        <SpotDetailModal
          spot={favorites.find((f) => f.content_id === selectedSpot)!}
          isVisible={true}
          onDismiss={handleCloseDetail}
          userLocation={{ lat, lon }}
        />
      )}

      <div className="w-full relative">
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
                {isUserLoading
                  ? '로딩 중...'
                  : `${getUserDisplayName()} 님 안녕하세요`}
              </h1>
              <p className="text-sm text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary mb-3">
                나만의 제주 여행지 보관함
              </p>

              {/* Accessibility Icons */}
              {userInfo && (
                <div className="flex gap-3 text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary">
                  {userInfo.is_disabled === 1 && (
                    <div
                      className="flex flex-col items-center"
                      title="휠체어 사용"
                    >
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                        <UserCog size={20} />
                      </div>
                      <span className="text-[10px] mt-1">휠체어</span>
                    </div>
                  )}
                  {userInfo.with_child === 1 && (
                    <div
                      className="flex flex-col items-center"
                      title="아이 동반"
                    >
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                        <Baby size={20} />
                      </div>
                      <span className="text-[10px] mt-1">아이</span>
                    </div>
                  )}
                  {userInfo.with_pet === 1 && (
                    <div
                      className="flex flex-col items-center"
                      title="반려동물 동반"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <PawPrint size={20} />
                      </div>
                      <span className="text-[10px] mt-1">반려동물</span>
                    </div>
                  )}
                  {userInfo.has_stroller === 1 && (
                    <div
                      className="flex flex-col items-center"
                      title="유모차 사용"
                    >
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                        <ShoppingCart size={20} />
                      </div>
                      <span className="text-[10px] mt-1">유모차</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate({ to: '/user' })}
              className="flex flex-col items-center gap-1 text-xs text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary hover:text-jeju-light-primary dark:hover:text-jeju-light-primary transition-colors shrink-0"
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
                  src={spot.second_image || spot.first_image || fallbackImage} // Fallback logic
                  alt={spot.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImage;
                  }}
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
