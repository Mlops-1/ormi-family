import { FavoritesAPI } from '@/api/favorites';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useMapStore } from '@/store/mapStore';
import { useUserStore } from '@/store/userStore';
import type { Coordinates } from '@/types/geo';
import type { SpotCard } from '@/types/spot';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import {
  Bot,
  Flag,
  Heart,
  Info,
  MapPin,
  Menu,
  Navigation,
  Plus,
  Smile,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
export type RouteAction = 'fast' | 'start' | 'end' | 'waypoint';

interface Props {
  // State
  activeSpot: SpotCard | null;
  isFavoritesMode: boolean;

  // Actions
  onToggleFavoritesMode: () => void;
  onSpotClose: () => void;
  onViewSpotDetails: (spot: SpotCard) => void;
  onRouteSelect: (action: RouteAction) => void;

  // Context Data
  currentLocation: Coordinates | null;
  distanceToSpot?: number;
  hasStart: boolean;
  hasEnd: boolean;

  // Handlers for managing location
  onSelectCurrentLocation: () => void;
  onLocationSelect: (loc: {
    coordinates: Coordinates;
    name: string;
    id: string;
  }) => void;
}

export default function BottomNavigation({
  activeSpot,
  isFavoritesMode,
  onToggleFavoritesMode,
  onSpotClose,
  onViewSpotDetails,
  onRouteSelect,
  currentLocation,
  distanceToSpot,
  hasStart,
  hasEnd,
  onSelectCurrentLocation,
  onLocationSelect,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    'location' | 'chat' | 'my-places' | null
  >(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { mode } = useUserStore();
  const themeColor = mode === 'pet' ? 'text-ormi-green-600' : 'text-orange-600';
  const themeBg = mode === 'pet' ? 'bg-ormi-green-500' : 'bg-orange-500';

  // State to track window width/orientation for responsive logic
  const [isMobilePortrait, setIsMobilePortrait] = useState(true);

  useEffect(() => {
    const checkResponsive = () => {
      // Define Mobile Portrait as: Width < 768 AND Height > Width
      const isMd = window.innerWidth >= 768;
      const isLandscape = window.innerWidth > window.innerHeight;

      if (isMd || isLandscape) {
        setIsMobilePortrait(false);
      } else {
        setIsMobilePortrait(true);
      }
    };

    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  // Reset tab and collapse state when spot is active
  useEffect(() => {
    if (activeSpot) {
      setActiveTab(null);
      setIsCollapsed(false);
    }
  }, [activeSpot]);

  const handleTabClick = (tab: 'location' | 'chat' | 'my-places') => {
    // If clicking the same tab, close it
    if (activeTab === tab) {
      setActiveTab(null);
      return;
    }

    // If a spot is active, we might want to close it to show the tab content
    if (activeSpot) {
      onSpotClose();
    }

    setActiveTab(tab);
    setIsCollapsed(false); // Always open full when clicking tabs
  };

  const isPanelOpen = !!activeSpot || !!activeTab;

  // Drag End Handler (Only for Mobile Portrait)
  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isMobilePortrait) return;

    const threshold = 50;
    if (info.offset.y > threshold) {
      // Dragged Down
      if (!isCollapsed) {
        setIsCollapsed(true);
      }
    } else if (info.offset.y < -threshold) {
      // Dragged Up
      setIsCollapsed(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-end">
      {/* Sliding Panel Content */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            // Variants for animation based on device
            initial={
              isMobilePortrait
                ? { y: '100%', opacity: 0 }
                : { x: '-100%', opacity: 0 }
            }
            animate={
              isMobilePortrait
                ? {
                    y: isCollapsed ? 'calc(100% - 90px)' : 0,
                    opacity: 1,
                    x: 0,
                  }
                : {
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }
            }
            exit={
              isMobilePortrait
                ? { y: '100%', opacity: 0 }
                : { x: '-110%', opacity: 0 }
            }
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            // Drag Props (Only enable Y drag on Mobile Portrait)
            drag={isMobilePortrait ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            dragElastic={0.2}
            // Layout Classes
            className={`
                bg-white shadow-2xl pointer-events-auto overflow-hidden absolute
                
                // Mobile Portrait
                w-full max-w-lg mx-auto left-0 right-0 rounded-t-3xl
                bottom-0 
                ${isMobilePortrait ? 'z-50' : 'z-40'}

                // Tablet (md)
                md:w-96 md:rounded-2xl md:bottom-24 md:left-4 md:right-auto md:max-w-none md:top-auto

                // Landscape (Phone/Tablet)
                landscape:left-0 landscape:top-0 landscape:bottom-20 landscape:w-80 landscape:rounded-r-2xl landscape:rounded-l-none landscape:border-r landscape:border-gray-100
                landscape:md:bottom-24 landscape:md:left-4 landscape:md:w-96 landscape:md:rounded-2xl landscape:md:top-auto landscape:md:border-none
            `}
            style={{
              // Heights
              height: isMobilePortrait
                ? 'auto'
                : activeTab === 'my-places'
                  ? 'calc(100vh - 100px)' // Taller for My Places on tablet/desktop as requested
                  : 'auto',
              maxHeight: isMobilePortrait
                ? '80vh'
                : activeTab === 'my-places'
                  ? '90vh'
                  : '85vh',
              minHeight: isMobilePortrait
                ? isCollapsed
                  ? '0px'
                  : '30vh'
                : 'auto',

              // Padding Bottom Logic
              paddingBottom: isMobilePortrait
                ? isCollapsed
                  ? '0px'
                  : '80px' // Reduced padding as dock is shorter now
                : '20px',

              // If My Places is active on non-mobile, push it up higher
              ...(!isMobilePortrait && activeTab === 'my-places'
                ? { top: '80px', bottom: 'auto' }
                : {}),
            }}
          >
            {/* Drag Handle - Only on Mobile */}
            {isMobilePortrait && (
              <div
                className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>
            )}

            {/* Close Button for Tablet/Landscape/MyPlaces */}
            {!isMobilePortrait && (
              <button
                onClick={activeSpot ? onSpotClose : () => setActiveTab(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-50 transition-colors"
              >
                <X size={18} />
              </button>
            )}

            {/* Content Switcher */}
            <div
              className={`h-full overflow-y-auto ${isCollapsed && isMobilePortrait ? 'overflow-hidden' : ''}`}
            >
              {activeSpot && (
                <SpotDetailContent
                  spot={activeSpot}
                  distance={distanceToSpot}
                  onClose={onSpotClose}
                  onViewCard={() => onViewSpotDetails(activeSpot)}
                  onRouteSelect={onRouteSelect}
                  hasStart={hasStart}
                  hasEnd={hasEnd}
                  themeColor={themeColor}
                  themeBg={themeBg}
                  isCollapsed={isCollapsed && isMobilePortrait}
                  hideCloseButton={!isMobilePortrait}
                />
              )}
              {activeTab === 'location' && (
                <LocationSettingContent
                  currentLocation={currentLocation}
                  onSelectCurrentLocation={() => {
                    onSelectCurrentLocation();
                    setActiveTab(null);
                  }}
                  onLocationSelect={(loc: any) => {
                    onLocationSelect(loc);
                    setActiveTab(null);
                  }}
                  themeColor={themeColor}
                  themeBg={themeBg}
                />
              )}
              {activeTab === 'chat' && (
                <ChatbotContent themeColor={themeColor} />
              )}
              {activeTab === 'my-places' && (
                <MyPlacesContent
                  onSpotClick={(spot: SpotCard) => {
                    onViewSpotDetails(spot);
                    // Standard behavior: clicking a spot opens it.
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock (Bottom Navigation Bar) */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50 flex justify-center">
        <div
          className={`
            w-full bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] 
            px-6 py-2 pb-5 pointer-events-auto flex items-center justify-between relative
            
            // Constrain Width on Tablet/Desktop
            md:max-w-screen-sm md:rounded-t-2xl md:pb-4 md:mb-4 md:shadow-xl md:border-x md:border-gray-100
            
            // Landscape Phone: slightly lower height/padding
            landscape:py-2 landscape:pb-3
        `}
        >
          {/* Location Setting */}
          <NavButton
            icon={<MapPin size={24} />}
            label="기준위치"
            isActive={activeTab === 'location'}
            onClick={() => handleTabClick('location')}
            themeColor={themeColor}
          />

          {/* Favorites/Recommend Toggle - Redesigned as Pill/Small Button */}
          <button
            onClick={onToggleFavoritesMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 active:scale-95 shadow-sm border ${
              isFavoritesMode
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isFavoritesMode ? (
                  <motion.div
                    key="heart"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Heart fill="currentColor" size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="smile"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Smile size={20} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="text-xs font-bold whitespace-nowrap">
              {isFavoritesMode ? '찜한 곳' : '추천'}
            </span>
          </button>

          {/* AI Chatbot */}
          <NavButton
            icon={<Bot size={24} />}
            label="AI 챗봇"
            isActive={activeTab === 'chat'}
            onClick={() => handleTabClick('chat')}
            themeColor={themeColor}
          />

          {/* My Places */}
          <NavButton
            icon={<Menu size={24} />}
            label="내 장소"
            isActive={activeTab === 'my-places'}
            onClick={() => handleTabClick('my-places')}
            themeColor={themeColor}
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({
  icon,
  label,
  isActive,
  onClick,
  themeColor,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  themeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all active:scale-95 px-2 ${isActive ? themeColor : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div
        className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="nav-dot"
          className={`w-1 h-1 rounded-full ${themeColor.replace('text-', 'bg-')} mt-0.5`}
        />
      )}
    </button>
  );
}

// --- Content Subcomponents ---

function SpotDetailContent({
  spot,
  distance,
  onClose,
  onViewCard,
  onRouteSelect,
  hasStart,
  hasEnd,
  themeColor,
  themeBg,
  isCollapsed,
  hideCloseButton,
}: any) {
  const formatDistance = (m?: number) => {
    if (!m) return '';
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${m}m`;
  };

  if (isCollapsed) {
    return (
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {spot.title}
            </h2>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              {distance && (
                <span className={`font-bold ${themeColor}`}>
                  {formatDistance(distance)}
                </span>
              )}
              <span>·</span>
              <span className="truncate">{spot.addr_1 || spot.addr_2}</span>
            </div>
          </div>
          {/* Minimal Route Button */}
          <button
            onClick={() => onRouteSelect('fast')}
            className={`shrink-0 p-2.5 rounded-full ${themeBg} text-white shadow-md active:scale-95`}
          >
            <Navigation size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 pt-2">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {spot.title}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span className="truncate max-w-[200px]">
              {spot.addr_1 || spot.addr_2}
            </span>
            {distance && (
              <span className={`font-bold ${themeColor}`}>
                {formatDistance(distance)}
              </span>
            )}
          </div>
          {/* Tags */}
          <div className="flex gap-2 mt-3">
            {spot.category && (
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                {spot.category}
              </span>
            )}
            {spot.is_indoor && (
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs">
                실내
              </span>
            )}
          </div>
        </div>
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={onViewCard}
          className={`${themeBg} text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md`}
        >
          <Info size={18} />
          <span className="whitespace-nowrap">카드 상세</span>
        </button>
        <button
          onClick={() => onRouteSelect('fast')}
          className="bg-orange-50 text-orange-600 border border-orange-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 active:scale-95 transition-all"
        >
          <Navigation size={18} />
          <span className="whitespace-nowrap">바로 안내</span>
        </button>
      </div>

      <div className="flex gap-2">
        <RouteBtn
          icon={<Flag size={16} />}
          label={hasStart ? '출발 변경' : '출발지'}
          onClick={() => onRouteSelect('start')}
          color="blue"
        />
        <RouteBtn
          icon={<MapPin size={16} />}
          label={hasEnd ? '도착 변경' : '도착지'}
          onClick={() => onRouteSelect('end')}
          color="red"
        />
        <RouteBtn
          icon={<Plus size={16} />}
          label="경유지"
          onClick={() => onRouteSelect('waypoint')}
          color="green"
          disabled={!hasStart && !hasEnd}
        />
      </div>
    </div>
  );
}

function RouteBtn({ icon, label, onClick, color, disabled }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    red: 'bg-red-50 text-red-600 hover:bg-red-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${colors[color]} ${disabled ? 'opacity-50 grayscale' : ''}`}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function LocationSettingContent({
  currentLocation,
  onSelectCurrentLocation,
  onLocationSelect,
  themeBg,
}: any) {
  const { savedLocations, removeSavedLocation } = useMapStore();

  return (
    <div className="px-5 pb-6 pt-2">
      <h3 className="text-lg font-bold text-gray-900 mb-4">기준 위치 설정</h3>

      <div className="space-y-3">
        <button
          onClick={onSelectCurrentLocation}
          className="w-full p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div
            className={`w-10 h-10 rounded-full ${themeBg} flex items-center justify-center text-white`}
          >
            <Navigation size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900">내 현재 위치</div>
            <div className="text-xs text-gray-500">GPS 기반 자동 설정</div>
          </div>
        </button>

        <div className="text-sm font-bold text-gray-500 mt-2 ml-1">
          저장된 위치 ({savedLocations.length}/6)
        </div>

        {savedLocations.length === 0 ? (
          <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            저장된 위치가 없습니다.
            <br />
            지도에서 원하는 곳을 길게 눌러보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {savedLocations.map((loc: any) => (
              <div key={loc.id} className="relative group">
                <button
                  onClick={() => onLocationSelect(loc)}
                  className="w-full p-3 rounded-xl bg-white border border-gray-200 flex items-center gap-3 hover:border-orange-200 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold shrink-0">
                    {loc.name[0]}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="font-medium text-gray-900 truncate">
                      {loc.name}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSavedLocation(loc.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2Icon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Trash2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function ChatbotContent({ themeColor }: any) {
  return (
    <div className="px-5 pb-6 pt-2 h-64 flex flex-col items-center justify-center text-center">
      <div
        className={`w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 ${themeColor}`}
      >
        <Bot size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        AI 여행 가이드 (준비중)
      </h3>
      <p className="text-gray-500 text-sm max-w-xs">
        곧 챗봇이 제주도 여행 일정을
        <br />
        맞춤 추천해드릴 예정이에요! 조금만 기다려주세요.
      </p>
    </div>
  );
}

function MyPlacesContent({
  onSpotClick,
}: {
  onSpotClick: (spot: SpotCard) => void;
}) {
  const [favorites, setFavorites] = useState<SpotCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await FavoritesAPI.getFavorites({ user_id: TEMP_USER_ID });
        setFavorites(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading)
    return <div className="p-8 text-center text-gray-400">로딩 중...</div>;
  if (favorites.length === 0)
    return (
      <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
        <Heart size={32} className="text-gray-200" />
        <p>아직 찜한 장소가 없어요.</p>
      </div>
    );

  return (
    <div className="px-5 pb-6 pt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          내 장소 ({favorites.length})
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {favorites.map((spot) => (
          <button
            key={spot.content_id}
            onClick={() => onSpotClick(spot)}
            className="text-left group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
          >
            <img
              src={spot.first_image || ''}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onError={(e: any) => (e.target.style.display = 'none')}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
              <div className="text-white font-bold text-sm truncate">
                {spot.title}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
