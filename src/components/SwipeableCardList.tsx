import { FavoritesAPI } from '@/api/favorites';
import fallbackImage from '@/assets/images/fallback_spot.jpg';
import AccessibilityInfo from '@/components/AccessibilityInfo';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Heart, Map as MapIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface Props {
  items: SpotCard[];
  userLocation?: Coordinates;
  onIndexChange?: (index: number) => void;
  onToggleMapMode?: () => void;
  onLoadMore?: () => void;
  selectedIndex?: number; // Added to support jumping to specific card
}

export default function SwipeableCardList({
  items,
  userLocation,
  onIndexChange,
  onToggleMapMode,
  onLoadMore,
  selectedIndex = 0,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [prevSelectedIndex, setPrevSelectedIndex] = useState(selectedIndex);
  const [direction, setDirection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref for immediate locking to prevent rapid-fire requests
  const isProcessingRef = useRef(false);

  const analytics = useAnalytics();
  const x = useMotionValue(0);

  // Sync internal state when parent requests a specific index (derived state pattern)
  if (selectedIndex !== undefined && selectedIndex !== prevSelectedIndex) {
    setPrevSelectedIndex(selectedIndex);
    if (items.length > 0 && selectedIndex !== currentIndex) {
      setCurrentIndex(selectedIndex);
    }
  }

  const currentCard = items[currentIndex];

  /* Refactored handleNext to accept direction */
  const handleNext = useCallback(
    async (
      isSkip = false,
      swipeDirection: string = 'right',
      swipeDistance: number = 0,
      dirValue: number = 1
    ) => {
      // Release skip lock after a short delay
      if (isSkip) {
        setTimeout(() => {
          isProcessingRef.current = false;
          setIsProcessing(false);
        }, 300);
      }

      if (items.length === 0) return;

      if (isSkip && currentCard) {
        try {
          await analytics.trackSkip?.(
            currentCard.content_id.toString(),
            swipeDirection,
            swipeDistance
          );
        } catch (err) {
          // console.error('Failed to track skip event', err);
        }
      }

      setDirection(dirValue);
      setCurrentIndex((prev) => {
        const next = (prev + 1) % items.length;
        onIndexChange?.(next); // Notify parent

        // Infinite Scroll Trigger
        if (items.length - next <= 3) {
          onLoadMore?.();
        }
        return next;
      });
    },
    [items.length, currentCard, analytics, onIndexChange, onLoadMore]
  );

  const triggerLike = useCallback(async () => {
    // Double Guard: Check both state and ref
    if (isProcessing || isProcessingRef.current) return;

    // Lock immediately
    setIsProcessing(true);
    isProcessingRef.current = true;

    setShowLikeOverlay(true);

    if (currentCard) {
      try {
        await FavoritesAPI.addFavorite({
          user_id: TEMP_USER_ID,
          content_id: currentCard.content_id,
        });
        await analytics.trackLike?.(currentCard.content_id.toString(), {
          score: currentCard.score,
          category: currentCard.category_1,
        });
        // Dispatch event
        window.dispatchEvent(new Event('refreshFavorites'));
      } catch (err) {
        console.error('Failed to add favorite', err);
      }
    }

    setTimeout(() => {
      setShowLikeOverlay(false);
      // Direction 1 (Positive) for Like Animation (Right Swipe / Left Pulled)
      // Like is now Right Swipe (x > 0), so dirValue = 1
      handleNext(false, 'right', 0, 1);

      // Delay unlocking to ensure animation clears
      setTimeout(() => {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }, 500);
    }, 800);
  }, [currentCard, isProcessing, analytics, handleNext]);

  const handleDragEnd = useCallback(
    (
      _: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { x: number; y: number } }
    ) => {
      // Check lock
      if (isProcessing || isProcessingRef.current) return;

      const { x, y } = info.offset;
      const swipeDistance = Math.sqrt(x * x + y * y);

      const HORIZONTAL_THRESHOLD = 80;
      const PULL_DOWN_THRESHOLD = 100;

      // Logic Swap Reverted:
      // Right Swipe (x > 80): Like
      // Left Swipe (x < -80): Skip
      // Down (> 100): Map Mode

      if (y > PULL_DOWN_THRESHOLD && Math.abs(x) < HORIZONTAL_THRESHOLD) {
        onToggleMapMode?.();
      } else if (x > HORIZONTAL_THRESHOLD) {
        // Right Swipe -> Like
        triggerLike();
      } else if (x < -HORIZONTAL_THRESHOLD) {
        // Left Swipe -> Skip
        isProcessingRef.current = true; // Lock for skip too
        setIsProcessing(true);
        handleNext(true, 'left', swipeDistance, -1);
      }
    },
    [isProcessing, handleNext, triggerLike, onToggleMapMode]
  );

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    exit: (direction: number) => {
      if (direction > 0) {
        // LIKE: Suck into bottom logic (Z-axis Spin)
        return {
          x: 0,
          y: 500, // Drop down
          rotate: 720, // Full Z-axis spin (2 turns)
          scale: 0, // Shrink to zero
          opacity: 0, // Fade out
          transition: { duration: 0.8, ease: 'easeInOut' },
        };
      }
      // SKIP: Fly Left
      return {
        x: -500,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 },
      };
    },
  };

  const getDistance = (
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
    return (R * c).toFixed(1);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border border-jeju-light-divider dark:border-slate-600 h-64 w-full max-w-sm mx-auto">
        <p className="text-gray-500 dark:text-gray-400">
          표시할 장소가 없습니다.
        </p>
      </div>
    );
  }

  // Safety check if index is out of bounds due to filters
  if (!currentCard) {
    // Auto-correct could go here, or just return null
    // But Effect should handle it next render if parent updates.
    // If items exist but index is wrong, just show 0?
    return null;
  }

  const distance = userLocation
    ? getDistance(
        userLocation.lat,
        userLocation.lon,
        currentCard.lat,
        currentCard.lon
      )
    : null;

  return (
    <div className="w-full flex flex-col items-center h-full justify-center relative">
      <div className="flex items-center gap-1 text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary text-sm mb-2 animate-pulse">
        <MapIcon size={14} />
        <span>카드를 아래로 당겨 지도 보기</span>
      </div>

      <AnimatePresence>
        {showLikeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
              className="flex flex-col items-center justify-center text-white"
            >
              <Heart
                size={80}
                className="fill-jeju-light-primary text-jeju-light-primary mb-4 drop-shadow-lg"
              />
              <span className="text-2xl font-bold drop-shadow-md">
                찜 되었습니다!
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-[550px] flex items-center justify-center overflow-visible perspective-1000">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentCard.content_id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="absolute w-full px-4 cursor-grab active:cursor-grabbing h-full z-10 font-sans"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-none shadow-2xl border border-white/20 h-full flex flex-col relative group overflow-hidden">
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 0 : '50%' }}
                transition={{ duration: 0.3 }}
                className="w-full bg-jeju-light-divider relative overflow-hidden shrink-0 rounded-none"
              >
                <img
                  src={currentCard.first_image || fallbackImage}
                  alt={currentCard.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="absolute top-4 right-4 bg-jeju-light-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce origin-right">
                  AI 매칭 {Math.round(currentCard.score * 100)}%
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-black/50 to-transparent opacity-60"></div>
              </motion.div>

              <div className="p-6 flex flex-col flex-1 bg-transparent relative min-h-0 rounded-none overflow-visible">
                <div className="flex justify-between items-start mb-1 shrink-0">
                  <h3 className="text-2xl font-bold text-gray-900 line-clamp-1 leading-tight drop-shadow-sm">
                    {currentCard.title}
                  </h3>
                </div>

                {distance && (
                  <div className="flex items-center gap-1 text-sm text-ormi-pink-600 font-medium mb-3 shrink-0">
                    <span>📍 현 위치에서 {distance}km</span>
                  </div>
                )}

                <div className="text-gray-700 text-base flex flex-col min-h-0 flex-1">
                  <div className="flex-shrink-0">
                    <p className="mb-2 font-medium">{currentCard.addr_1}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {currentCard.tel ? `📞 ${currentCard.tel}` : ''}
                    </p>
                    <AccessibilityInfo spot={currentCard} />
                  </div>

                  {currentCard.reviews && currentCard.reviews.length > 0 && (
                    <div
                      className={`mt-6 border-t border-gray-200 pt-4 flex flex-col min-h-0 ${isExpanded ? 'flex-1 overflow-hidden' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-800">
                          방문자 리뷰 ({currentCard.reviews.length})
                        </span>
                        {currentCard.reviews.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExpanded(!isExpanded);
                            }}
                            className="text-xs text-jeju-light-primary hover:text-jeju-light-primary/80 font-medium whitespace-nowrap px-2 py-1 shrink-0 bg-white/50 rounded-full"
                          >
                            {isExpanded ? '접기' : '더보기'}
                          </button>
                        )}
                      </div>

                      <div
                        className={`flex flex-col gap-3 ${isExpanded ? 'overflow-y-auto pr-1' : ''}`}
                      >
                        {(isExpanded
                          ? currentCard.reviews
                          : [currentCard.reviews[0]]
                        ).map((review) => (
                          <div
                            key={review.review_id}
                            className="bg-white/60 p-3 rounded-none text-sm border border-gray-100 shrink-0 shadow-sm"
                          >
                            <div className="text-xs text-gray-400 mb-1">
                              {new Date(review.created_at).toLocaleDateString(
                                'ko-KR',
                                { month: 'long', day: 'numeric' }
                              )}
                            </div>
                            <p className="text-gray-700 leading-relaxed font-sans">
                              {review.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
