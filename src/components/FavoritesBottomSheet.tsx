import { FavoritesAPI } from '@/api/favorites';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { type SpotCard } from '@/types/spot';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { ChevronUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Initial Category Options

export default function FavoritesBottomSheet({
  onSpotClick,
}: {
  onSpotClick?: (spot: SpotCard) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<SpotCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const controls = useDragControls();

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const response = await FavoritesAPI.getFavorites({
        user_id: TEMP_USER_ID,
      });
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen]);

  // Listen for a custom event 'refreshFavorites' to reload data when a new item is added
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen) fetchFavorites();
    };
    window.addEventListener('refreshFavorites', handleRefresh);
    return () => window.removeEventListener('refreshFavorites', handleRefresh);
  }, [isOpen]);

  // Grouping Logic
  const groupedFavorites = useMemo(() => {
    if (!favorites) return {};

    // 1. Sort by Date Desc
    const sorted = [...favorites].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 3. Group by Year (User requested "2 year unit" or simplified unit due to length, inferring Year)
    const groups: Record<string, SpotCard[]> = {};
    sorted.forEach((item) => {
      const dateObj = new Date(item.created_at);
      const yearKey = isNaN(dateObj.getTime())
        ? '날짜 불명'
        : `${dateObj.getFullYear()}년`;
      if (!groups[yearKey]) groups[yearKey] = [];
      groups[yearKey].push(item);
    });

    return groups;
  }, [favorites]);

  return (
    <>
      {/* Trigger Tab - Bottom Center Edge */}
      {!isOpen && (
        <motion.div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <motion.div
            onClick={() => setIsOpen(true)}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 5 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y < -20 || velocity.y < -10) {
                setIsOpen(true);
              }
            }}
            // Curtain Handle Style - Enhanced Tab with Chevron
            className="w-48 h-6 bg-orange-500 dark:bg-ormi-green-600 rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer pointer-events-auto active:opacity-90 border-t border-white/20"
          >
            <ChevronUp className="text-white w-5 h-5 animate-pulse" />
          </motion.div>
        </motion.div>
      )}

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            drag="y"
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 150) setIsOpen(false);
            }}
            className="absolute inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col pointer-events-auto"
          >
            {/* Header / Drag Handle */}
            <div
              className="w-full h-16 flex items-center justify-between px-4 shrink-0 bg-orange-500 dark:bg-ormi-green-600 z-[110] text-white shadow-md relative"
              onPointerDown={(e) => controls.start(e)}
            >
              {/* Decorative "Curtain Top" Curve effect could go here if needed, but sticking to clean header explicitly requested as main color */}

              <div className="w-8" />
              <div className="font-bold text-lg">
                찜한 장소{' '}
                <span className="text-white/80 text-sm ml-1">
                  {favorites.length}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-white/90 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content List - Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-1 bg-white dark:bg-slate-900">
              {isLoading && favorites.length === 0 ? (
                <div className="flex justify-center py-20 text-gray-400">
                  로딩 중...
                </div>
              ) : Object.keys(groupedFavorites).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-2">
                  <p>찜한 장소가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-6 pb-20">
                  {Object.entries(groupedFavorites).map(([date, items]) => (
                    <div key={date}>
                      <h3 className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {date}
                      </h3>
                      <div className="grid grid-cols-4 gap-0.5">
                        {items.map((spot) => (
                          <div
                            key={spot.content_id}
                            className="aspect-square relative bg-gray-100 dark:bg-slate-800 cursor-pointer overflow-hidden group"
                            onClick={() => {
                              // Optional: navigate to spot or show detail
                              console.log('Clicked', spot.title);
                              if (onSpotClick) {
                                onSpotClick(spot);
                                setIsOpen(false);
                              }
                            }}
                          >
                            <img
                              src={spot.first_image || ''}
                              alt={spot.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://via.placeholder.com/300?text=No+Image'; // Better fallback for square
                              }}
                            />
                            {/* Gradient Overlay for Title (Optional, but user said JUST thumbnail... keeping clean) */}
                            {/* <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" /> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
