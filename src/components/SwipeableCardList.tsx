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
    setCurrentIndex(0);
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
      <div className="text-gray-400 p-8 text-center">
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
    <div className="w-full flex flex-col items-center">
      <p className="text-gray-400 text-sm mb-4 animate-pulse">
        오른쪽으로 당겨보세요
      </p>

      <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
        {notifications.length > 0 && (
          <div
            style={
              {
                '--color-text-status-info': 'var(--color-ormi-pink-500)',
              } as any
            }
          >
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
            className="absolute w-full px-4 cursor-grab active:cursor-grabbing max-w-lg md:max-w-2xl"
          >
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-ormi-green-200 h-[380px] flex flex-col relative group">
              {/* Card Image */}
              <div className="h-48 w-full bg-gray-200 relative overflow-hidden">
                <img
                  src={currentCard.img_url}
                  alt={currentCard.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
                  AI 매칭 98%
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                    {currentCard.title}
                  </h3>
                  {distance && (
                    <span className="text-xs text-gray-400 whitespace-nowrap pt-1">
                      📍 {distance}km
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                  {currentCard.description}
                </p>

                <div className="w-full">
                  <Button
                    variant="outlined"
                    color="ember"
                    fullWidth
                    onClick={handleNext}
                  >
                    자세히 보기
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
