import { FavoritesAPI } from '@/api/favorites';
import fallbackImage from '@/assets/images/fallback_spot.jpg';
import fireworksAnimation from '@/assets/lotties/fireworks.json';
import AccessibilityInfo from '@/components/view/AccessibilityInfo';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUserStore } from '@/store/userStore';
import type { Coordinates } from '@/types/geo';
import type { FavoriteSpot, SpotCard } from '@/types/spot';
import { formatTag, parseTags } from '@/utils/tagUtils';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import Lottie from 'lottie-react';
import { Heart } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  items: SpotCard[];
  userLocation?: Coordinates;
  onIndexChange?: (index: number) => void;
  onToggleMapMode?: () => void;
  onLoadMore?: () => void;
  selectedIndex?: number; // Added to support jumping to specific card
  onNavigate?: () => void;
}

export default function SwipeableCardList({
  items,
  userLocation,
  onIndexChange,
  onToggleMapMode,
  onLoadMore,
  selectedIndex = 0,
  onNavigate,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [prevSelectedIndex, setPrevSelectedIndex] = useState(selectedIndex);
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  const mainColorClass = isPetMode ? 'bg-ormi-green-500' : 'bg-orange-500';
  const mainHoverClass = isPetMode
    ? 'hover:bg-ormi-green-600'
    : 'hover:bg-orange-600';
  const mainTextColorClass = isPetMode
    ? 'text-ormi-green-500'
    : 'text-orange-500';
  // const _mainShadowClass = isPetMode
  //   ? 'shadow-ormi-green-500/30'
  //   : 'shadow-orange-500/30';
  const fillHeartClass = isPetMode ? 'fill-ormi-green-500' : 'fill-orange-500';
  const textHeartClass = isPetMode ? 'text-ormi-green-500' : 'text-orange-500';
  const [direction, setDirection] = useState(0);
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

  // Parse festival data if available
  const isFestival = currentCard
    ? currentCard.category_1 === 'FESTIVAL' ||
      currentCard.cat1 === 'EVENT' ||
      currentCard.cat2 === 'FESTIVAL'
    : false;

  let festivalData: {
    st_dt: string;
    ed_dt: string;
    pricetype: string;
  } | null = null;

  if (isFestival && currentCard?.festivalcontents) {
    try {
      festivalData = JSON.parse(currentCard.festivalcontents);
    } catch (e) {
      console.error('Failed to parse festival contents', e);
    }
  }

  // Check if ON AIR (Show if festival has not ended yet)
  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const isOnAir = isFestival && festivalData && todayStr <= festivalData.ed_dt;

  // Parse tags if this is a favorite card
  const tags = parseTags((currentCard as FavoriteSpot)?.tag);
  const hasScore = currentCard?.score !== undefined && currentCard?.score > 0;

  // Debug logging
  useEffect(() => {
    if (currentCard) {
      console.log('SwipeableCardList Current Card:', currentCard);
      if (!currentCard.content_id) {
        console.error('CRITICAL: Card missing content_id!', currentCard);
      }
    }
  }, [currentCard]);

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
        } catch {
          // console.error('Failed to track skip event', err);
        }
      }

      setDirection(dirValue);
      const nextIndex = (currentIndex + 1) % items.length;
      setCurrentIndex(nextIndex);
      onIndexChange?.(nextIndex); // Notify parent outside updater

      // Infinite Scroll Trigger
      if (items.length - nextIndex <= 3) {
        onLoadMore?.();
      }
    },
    [
      items.length,
      currentIndex,
      currentCard,
      analytics,
      onIndexChange,
      onLoadMore,
    ]
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

      const HORIZONTAL_THRESHOLD = 100;
      const VERTICAL_THRESHOLD = 120;

      // Determine dominant direction
      const absX = Math.abs(x);
      const absY = Math.abs(y);

      // Only allow 3 specific directions:
      // 1. Left (x < -100 and absX > absY): Skip
      // 2. Right (x > 100 and absX > absY): Like
      // 3. Down (y > 120 and absY > absX): Map Mode

      if (absY > absX) {
        // Vertical dominant
        if (y > VERTICAL_THRESHOLD) {
          // Down swipe -> Map Mode
          onToggleMapMode?.();
        }
        // Ignore up swipes (y < 0)
      } else {
        // Horizontal dominant
        if (x > HORIZONTAL_THRESHOLD) {
          // Right Swipe -> Like
          triggerLike();
        } else if (x < -HORIZONTAL_THRESHOLD) {
          // Left Swipe -> Skip
          isProcessingRef.current = true;
          setIsProcessing(true);
          handleNext(true, 'left', swipeDistance, -1);
        }
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
          transition: { duration: 0.8, ease: 'easeInOut' as const },
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

  // Handle map mode toggle when clicking empty space
  const handleContainerClick = (e: React.MouseEvent) => {
    // If clicking the container itself (empty space), go back to map mode
    if (e.target === e.currentTarget) {
      onToggleMapMode?.();
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col justify-end relative pointer-events-auto"
      onClick={handleContainerClick}
    >
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
                className={`${fillHeartClass} ${textHeartClass} mb-4 drop-shadow-lg`}
              />
              <span className="text-2xl font-bold drop-shadow-md">
                찜 되었습니다!
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full max-h-[85vh] flex items-end justify-center overflow-visible perspective-1000 pb-0">
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
            className="absolute w-full px-0 cursor-grab active:cursor-grabbing h-full max-h-[700px] z-10 font-jeju bottom-0 pointer-events-auto touch-none select-none"
          >
            {/* Card Container */}
            <div className="bg-white rounded-t-[40px] rounded-b-none shadow-2xl border-t border-x border-white/20 h-full flex flex-col relative overflow-hidden">
              {/* Drag Handle */}
              <div
                className="w-full flex justify-center pt-3 pb-1 shrink-0 cursor-pointer active:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMapMode?.();
                }}
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {' '}
                {/* pb-24 for absolute buttons space */}
                {/* Image Section */}
                <div className="px-4 pt-2 pb-4">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-[32px] shadow-sm">
                    {isOnAir && (
                      <div className="absolute top-6 left-6 z-20 flex flex-col items-center pointer-events-none">
                        <div className="relative flex items-center justify-center">
                          <Lottie
                            animationData={fireworksAnimation}
                            className="absolute w-60 h-60 scale-150 opacity-90"
                            loop={true}
                          />
                          <div className="relative z-10 bg-linear-to-r from-red-600 to-pink-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-white/30 backdrop-blur-sm tracking-widest animate-pulse">
                            ON AIR
                          </div>
                        </div>
                      </div>
                    )}
                    <img
                      src={currentCard.first_image || fallbackImage}
                      alt={currentCard.title}
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallbackImage;
                      }}
                    />
                    {hasScore && (
                      <div
                        className={`absolute top-4 right-4 ${mainColorClass} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}
                      >
                        {Math.round(currentCard.score * 100)}% 매칭
                      </div>
                    )}
                  </div>
                </div>
                {/* Title & Info */}
                <div className="px-6 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                    {currentCard.title}
                  </h3>
                  {distance && (
                    <div
                      className={`text-sm ${mainTextColorClass} font-medium mb-1`}
                    >
                      📍 {distance}km
                    </div>
                  )}
                  <p className="text-gray-500 text-sm mb-3">
                    {currentCard.addr_1}
                  </p>

                  {/* Tags */}
                  {(() => {
                    if (!tags || tags.length === 0) return null;

                    // 1. Remove duplicates
                    const uniqueTags = Array.from(new Set(tags));

                    // 2. Sort based on theme
                    const sortedTags = uniqueTags.sort((a, b) => {
                      if (isPetMode) {
                        const aRate =
                          a.includes('반려') || a.includes('애견') ? 1 : 0;
                        const bRate =
                          b.includes('반려') || b.includes('애견') ? 1 : 0;
                        return bRate - aRate;
                      } else {
                        // Toddler Mode
                        const aRate =
                          a.includes('아이') || a.includes('유아') ? 1 : 0;
                        const bRate =
                          b.includes('아이') || b.includes('유아') ? 1 : 0;
                        return bRate - aRate;
                      }
                    });

                    // 3. Limit to 6
                    const displayTags = sortedTags.slice(0, 6);

                    if (displayTags.length === 0) return null;

                    return (
                      <div className="flex flex-wrap gap-2">
                        {displayTags.map((tag, index) => (
                          <span
                            key={index}
                            className={`inline-block ${mainColorClass} text-white text-xs font-medium px-3 py-1 rounded-full`}
                          >
                            {formatTag(tag)}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {/* Festival Info or Review/Quote Box */}
                {(() => {
                  const isFestival =
                    currentCard.category_1 === 'FESTIVAL' ||
                    currentCard.cat1 === 'EVENT' ||
                    currentCard.cat2 === 'FESTIVAL';
                  let festivalData: {
                    st_dt: string;
                    ed_dt: string;
                    pricetype: string;
                  } | null = null;

                  if (isFestival && currentCard.festivalcontents) {
                    try {
                      festivalData = JSON.parse(currentCard.festivalcontents);
                    } catch (e) {
                      console.error('Failed to parse festival contents', e);
                    }
                  }

                  if (isFestival && festivalData) {
                    const formatDate = (dateStr: string) => {
                      if (!dateStr || dateStr.length !== 8) return dateStr;
                      return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6)}`;
                    };

                    return (
                      <div className="px-4 mb-6">
                        <div className="bg-orange-50/80 rounded-3xl p-5 border border-orange-100 relative overflow-hidden">
                          {/* Decorative Icon */}
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="text-6xl">🎉</span>
                          </div>

                          <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2 relative z-10">
                            <span className="text-xl">🎉</span> 진행중인 축제
                          </h4>
                          <div className="space-y-1.5 text-sm text-gray-700 relative z-10">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold min-w-10 text-orange-600">
                                기간
                              </span>
                              {formatDate(festivalData.st_dt)} ~{' '}
                              {formatDate(festivalData.ed_dt)}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold min-w-10 text-orange-600">
                                요금
                              </span>
                              <span
                                className={
                                  festivalData.pricetype === '무료'
                                    ? 'text-blue-600 font-bold'
                                    : 'text-gray-900'
                                }
                              >
                                {festivalData.pricetype}
                              </span>
                            </p>
                          </div>
                          {currentCard.sbst && (
                            <div className="mt-4 pt-3 border-t border-orange-200/50">
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4 text-justify">
                                {currentCard.sbst}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Default Review Box
                  if (currentCard.reviews && currentCard.reviews.length > 0) {
                    return (
                      <div className="px-4 mb-6">
                        <div className="bg-gray-50 rounded-3xl p-6 relative">
                          <span className="absolute top-4 left-4 text-4xl text-gray-200 font-serif leading-none">
                            "
                          </span>
                          <p className="text-gray-700 text-lg font-medium leading-relaxed relative z-10 pt-2 px-2 text-center break-keep">
                            {currentCard.reviews[0].detail.length > 50
                              ? `"${currentCard.reviews[0].detail.slice(0, 50)}..."`
                              : `"${currentCard.reviews[0].detail}"`}
                          </p>
                          <p className="text-center text-gray-400 text-sm mt-3">
                            주말 나들이 장소로 추천드립니다.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}
                {/* Accessibility Grid */}
                <div className="px-6 pb-6">
                  <AccessibilityInfo spot={currentCard} />
                </div>
              </div>

              {/* Bottom Fixed Buttons */}
              <div className="absolute bottom-18 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-6 rounded-t-3xl z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent drag
                      onNavigate?.();
                    }}
                    className={`flex-1 h-14 ${mainColorClass} ${mainHoverClass} active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-lg`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    길찾기
                  </button>

                  {currentCard.tel && (
                    <a
                      href={`tel:${currentCard.tel}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </a>
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
