import fallbackImage from '@/assets/images/fallback_spot.jpg';
import AccessibilityInfo from '@/components/AccessibilityInfo';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  items: SpotCard[];
  userLocation?: Coordinates;
}

export default function SwipeableCardList({ items, userLocation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);

  // Motion value for dragging x position
  const x = useMotionValue(0);

  // Ghost Effect Transforms
  // Opacity: Becomes fully opaque (1) quickly.
  const ghostOpacity = useTransform(x, [-50, 0, 50], [1, 0, 1]);

  // Rotation: Fans out symmetrically but closer to the main card (Trump style)
  const ghostRotate = useTransform(x, [-300, 300], [-5, 5]);

  // X Position: Follows card but lags very slightly (tight grouping)
  const ghostX = useTransform(x, [-300, 300], [-40, 40]);

  // Reset index when items change to prevent out of bounds
  // Also reset expanded state when card changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsExpanded(false);
  }, [items]);

  useEffect(() => {
    setIsExpanded(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (items.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const triggerLike = () => {
    setShowLikeOverlay(true);
    setTimeout(() => {
      setShowLikeOverlay(false);
      handleNext(); // Proceed to next card after like animation
    }, 1000);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } }
  ) => {
    const swipeThreshold = 100; // Increased threshold slightly to prevent accidental likes
    const { x } = info.offset;

    // Reset x manualy if needed, but framer motion handles it on release usually.
    if (x < -swipeThreshold) {
      handleNext(); // Pass (Swipe Left)
    } else if (x > swipeThreshold) {
      triggerLike(); // Like (Swipe Right)
    }
  };

  const currentCard = items[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 },
    }),
  };

  // Helper to calc distance (Haversine approx)
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // km
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
      <div className="text-jeju-light-text-disabled dark:text-jeju-dark-text-disabled p-8 text-center bg-jeju-light-surface dark:bg-jeju-dark-surface rounded-3xl shadow-sm border border-jeju-light-divider dark:border-jeju-dark-divider">
        표시할 장소가 없습니다.
      </div>
    );
  }

  // Safe check
  if (!currentCard) return null;

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
      <p className="text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary text-sm mb-2 animate-pulse">
        오른쪽으로 당겨보세요
      </p>

      {/* Like Overlay - Modal style */}
      <AnimatePresence>
        {showLikeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()} // Block clicks
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
        {/* Ghost Trail Element - Visible during drag */}
        <motion.div
          style={{
            x: ghostX,
            rotate: ghostRotate,
            opacity: ghostOpacity,
          }}
          // Using explicit hex color to match the 'AI Match' badge exactly if tailwind class mismatches
          // But 'bg-jeju-light-primary' should be correct.
          // The AI badge uses: 'bg-jeju-light-primary'
          className="absolute top-0 w-full h-full bg-jeju-light-primary rounded-xl transform origin-bottom z-0"
        />

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentCard.content_id} // Use unique ID
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            style={{ x }} // Bind x motion value
            className="absolute w-full px-4 cursor-grab active:cursor-grabbing h-full z-10"
          >
            <div className="bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-jeju-light-divider dark:border-slate-600 h-full flex flex-col relative group">
              {/* Card Image - Collapsible */}
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 0 : '50%' }}
                transition={{ duration: 0.3 }}
                className="w-full bg-jeju-light-divider dark:bg-slate-600 relative overflow-hidden flex-shrink-0 rounded-t-xl"
              >
                <img
                  src={currentCard.first_image || fallbackImage}
                  alt={currentCard.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="absolute top-4 right-4 bg-jeju-light-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce transform origin-right">
                  AI 매칭 {Math.round(currentCard.score * 100)}%
                </div>
                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
              </motion.div>

              {/* Content Area - Expands to fill flex-1 */}
              <div className="p-6 flex flex-col flex-1 bg-white dark:bg-slate-700 relative min-h-0 rounded-b-xl overflow-visible">
                <div className="flex justify-between items-start mb-1 flex-shrink-0">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white line-clamp-1 leading-tight">
                    {currentCard.title}
                  </h3>
                </div>

                {distance && (
                  <div className="flex items-center gap-1 text-sm text-ormi-pink-500 dark:text-ormi-pink-400 font-medium mb-3 flex-shrink-0">
                    <span>📍 현 위치에서 {distance}km</span>
                  </div>
                )}

                <div className="text-gray-600 dark:text-gray-300 text-base flex flex-col min-h-0 flex-1">
                  <div className="flex-shrink-0">
                    <p className="mb-2 font-medium">{currentCard.addr_1}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {currentCard.tel ? `📞 ${currentCard.tel}` : ''}
                    </p>
                    <AccessibilityInfo spot={currentCard} />
                  </div>

                  {/* Reviews Section - Scrollable when expanded */}
                  {currentCard.reviews && currentCard.reviews.length > 0 && (
                    <div
                      className={`mt-6 border-t border-jeju-light-divider dark:border-slate-600 pt-4 flex flex-col min-h-0 ${isExpanded ? 'flex-1 overflow-hidden' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          방문자 리뷰 ({currentCard.reviews.length})
                        </span>
                        {currentCard.reviews.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExpanded(!isExpanded);
                            }}
                            className="text-xs text-jeju-light-primary hover:text-jeju-light-primary/80 font-medium whitespace-nowrap px-2 py-1"
                          >
                            {isExpanded ? '접기' : '더보기'}
                          </button>
                        )}
                      </div>

                      <div
                        className={`flex flex-col gap-3 ${isExpanded ? 'overflow-y-auto pr-1' : ''}`}
                      >
                        {/* Render Reviews */}
                        {(isExpanded
                          ? currentCard.reviews
                          : [currentCard.reviews[0]]
                        ).map((review, idx) => (
                          <div
                            key={review.review_id}
                            className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-sm border-t border-gray-100 dark:border-slate-700 flex-shrink-0"
                          >
                            <div className="text-xs text-gray-400 mb-1">
                              {new Date(review.created_at).toLocaleDateString(
                                'ko-KR',
                                { month: 'long', day: 'numeric' }
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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
