import fallbackImage from '@/assets/images/fallback_spot.jpg';
import Button from '@/components/Button';
import AppNotification from '@/components/Notification';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  items: SpotCard[];
  userLocation?: Coordinates;
}

export default function SwipeableCardList({ items, userLocation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; content: string }>
  >([]);

  // Reset index when items change to prevent out of bounds
  useEffect(() => {
    if (currentIndex !== 0) {
      setCurrentIndex(0);
    }
  }, [items]);

  const handleNext = () => {
    if (items.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const showNotification = () => {
    const id = Date.now().toString();
    setNotifications((prev) => [
      ...prev,
      { id, content: '이 장소를 찜하시겠습니까?' },
    ]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } }
  ) => {
    const swipeThreshold = 50;
    const { x } = info.offset;

    if (x < -swipeThreshold) {
      handleNext();
    } else if (x > swipeThreshold) {
      showNotification();
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
        currentCard.mapy,
        currentCard.mapx
      )
    : null;

  return (
    <div className="w-full flex flex-col items-center h-full justify-center">
      <p className="text-jeju-light-text-secondary dark:text-jeju-dark-text-secondary text-sm mb-2 animate-pulse">
        오른쪽으로 당겨보세요
      </p>

      <div className="relative w-full h-[550px] flex items-center justify-center overflow-visible">
        {notifications.length > 0 && (
          <div className="absolute top-4 z-50 w-full px-4">
            <AppNotification
              items={notifications.map((n) => ({
                id: n.id,
                content: n.content,
                type: 'info',
                onDismiss: () =>
                  setNotifications((prev) =>
                    prev.filter((item) => item.id !== n.id)
                  ),
              }))}
            />
          </div>
        )}

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentCard.contentid} // Use unique ID
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute w-full px-4 cursor-grab active:cursor-grabbing h-full"
          >
            <div className="bg-white dark:bg-slate-700 rounded-xl shadow-2xl overflow-hidden border border-jeju-light-divider dark:border-slate-600 h-full flex flex-col relative group">
              {/* Card Image */}
              <div className="h-[360px] w-full bg-jeju-light-divider dark:bg-slate-600 relative overflow-hidden">
                <img
                  src={currentCard.img_url || fallbackImage}
                  alt={currentCard.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="absolute top-4 right-4 bg-jeju-light-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce transform origin-right">
                  AI 매칭 98%
                </div>
                {/* Gradient Overlay for better text readability if needed */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
              </div>

              <div className="p-6 flex flex-col flex-1 bg-white dark:bg-slate-700 relative">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white line-clamp-1 leading-tight">
                    {currentCard.title}
                  </h3>
                </div>

                {distance && (
                  <div className="flex items-center gap-1 text-sm text-ormi-pink-500 dark:text-ormi-pink-400 font-medium mb-3">
                    <span>📍 현 위치에서 {distance}km</span>
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-300 text-base line-clamp-2 mb-4 flex-1">
                  {currentCard.description}
                </p>

                <div className="w-full mt-auto">
                  <Button
                    variant="primary"
                    fullWidth={true}
                    className="mt-4 shadow-lg shadow-jeju-light-primary/30"
                    onClick={handleNext}
                  >
                    다음 장소 보기
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
