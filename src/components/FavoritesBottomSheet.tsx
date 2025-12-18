import { FavoritesAPI } from '@/api/favorites';
import { TEMP_USER_ID } from '@/constants/temp_user';
import type { SpotCard } from '@/types/spot';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { ChevronUp, Heart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FavoritesBottomSheet() {
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

  return (
    <>
      {/* Trigger Tab - Bottom Center Edge */}
      {!isOpen && (
        <motion.div
          onClick={() => setIsOpen(true)}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        >
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="w-32 h-8 bg-orange-500 dark:bg-ormi-green-600 rounded-t-[100%] shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer pointer-events-auto"
          >
            <ChevronUp className="text-white w-6 h-6 -mt-1 animate-bounce" />
          </motion.div>
        </motion.div>
      )}

      {/* Full Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragControls={controls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 150) setIsOpen(false);
              }}
              className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col pointer-events-auto"
            >
              {/* Header / Drag Handle */}
              <div
                className="w-full h-20 md:h-24 flex items-end pb-4 justify-between px-6 shrink-0 cursor-grab active:cursor-grabbing bg-orange-50 dark:bg-slate-800 border-b border-orange-100 dark:border-slate-700"
                onPointerDown={(e) => controls.start(e)}
              >
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xl">
                  <Heart className="fill-current" />
                  찜한 장소 ({favorites.length})
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors z-[110]"
                  type="button"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900/50">
                {isLoading && favorites.length === 0 ? (
                  <div className="flex justify-center py-10 text-gray-400">
                    로딩 중...
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                    <Heart className="w-10 h-10 opacity-20" />
                    <p>찜한 장소가 없습니다.</p>
                  </div>
                ) : (
                  favorites.map((spot) => (
                    <motion.div
                      key={spot.content_id}
                      layoutId={`fav-${spot.content_id}`}
                      className="flex bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-700 gap-3"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                        <img
                          src={spot.first_image || ''}
                          alt={spot.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                          {spot.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                          {spot.addr_1}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          <span className="text-[10px] bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                            {spot.category_1}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        className="text-gray-300 hover:text-red-500 self-start p-1"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await FavoritesAPI.removeFavorite(
                              spot.content_id,
                              TEMP_USER_ID
                            );
                            setFavorites((prev) =>
                              prev.filter(
                                (f) => f.content_id !== spot.content_id
                              )
                            );
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
