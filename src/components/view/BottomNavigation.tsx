import { FavoritesAPI } from '@/api/favorites';
import {
  UserAPI,
  type ChildAgeGroup,
  type StrollerYN,
  type TravelStyle,
  type UserUpdatePayload,
} from '@/api/user';
import heartIcon from '@/assets/lotties/heart_icon.json';
import { AVAILABLE_USER_IDS } from '@/constants/temp_user';
import { useBottomFilterStore } from '@/store/bottomFilterStore';
import { useCourseHistoryStore } from '@/store/courseHistoryStore';
import { useMapStore, type SavedLocation } from '@/store/mapStore';
import { useUserStore } from '@/store/userStore';
import type { Course } from '@/types/course';
import type { Coordinates } from '@/types/geo';
import type { FavoriteSpot, SpotCard } from '@/types/spot';

import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from 'framer-motion';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import {
  Bot,
  Check,
  Flag,
  Heart,
  Info,
  Loader2,
  MapPin,
  Menu,
  Navigation,
  Plus,
  Save,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatbotContent from './ChatbotContent';
import CourseThumbnailMap from './CourseThumbnailMap';

// Types
export type RouteAction = 'fast' | 'start' | 'end' | 'waypoint';

interface ContentProps {
  themeColor: string;
  themeBg?: string;
}

interface Props {
  // State (from props)
  activeSpot: SpotCard | null;
  // isFavoritesMode removed (in store)

  // Actions
  // onToggleFavoritesMode removed (in store)
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
  // isFavoritesMode removed
  // onToggleFavoritesMode removed
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
  const {
    activeTab,
    isFavoritesMode,
    isCollapsed,
    setActiveTab,
    setIsCollapsed,
    toggleFavoritesMode,
    closeAll,
  } = useBottomFilterStore();

  const { mode } = useUserStore();
  const { setMapMode } = useMapStore();
  const themeColor = mode === 'pet' ? 'text-ormi-green-600' : 'text-orange-600';
  const themeBg = mode === 'pet' ? 'bg-ormi-green-500' : 'bg-orange-500';

  // State to track window width/orientation for responsive logic
  const [isMobilePortrait, setIsMobilePortrait] = useState(true);

  // Drag controls for reliable gesture handling on touch devices
  const dragControls = useDragControls();

  const lottieRef = useRef<LottieRefCurrentProps>(null);

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
  // Reset tab and collapse state when spot is active
  useEffect(() => {
    if (activeSpot) {
      closeAll();
      // setIsCollapsed(false); // closeAll resets collapse too? in store it sets isCollapsed: false.
      // But wait, if spot is active, maybe we want panels closed.
      // The original code set activeTab(null) and isCollapsed(false).
      // closeAll does exaclty that.
    }
  }, [activeSpot, closeAll]);

  const handleTabClick = (tab: 'location' | 'chat' | 'my-places') => {
    // If clicking the same tab, close it (handled by store logic usually, but let's check store)
    // Store: activeTab === tab ? null : tab.

    // If a spot is active, we might want to close it to show the tab content
    if (activeSpot) {
      onSpotClose();
    }

    // Toggle tab
    setActiveTab(tab);
    // Ensure we are in map mode (hides card list behind the panel)
    setMapMode(true);
    // Store automatically expands (isCollapsed = false) when setting tab.
  };

  const isPanelOpen = !!activeSpot || !!activeTab;

  // Drag End Handler (Only for Mobile Portrait)
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
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
      if (isCollapsed) {
        setIsCollapsed(false);
      } else if (activeSpot) {
        // If already expanded and dragged up further, go to full card view
        onViewSpotDetails(activeSpot);
      }
    }
  };

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex flex-col justify-end ${isMobilePortrait ? 'z-50' : 'z-40'}`}
    >
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
                    y: isCollapsed ? 'calc(100% - 110px)' : 0,
                    opacity: 1,
                    x: 0,
                    paddingTop:
                      activeTab === 'my-places' && !isCollapsed
                        ? '100px'
                        : '0px',
                  }
                : {
                    x: 0,
                    y: 0,
                    opacity: 1,
                    paddingTop: '0px',
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
            dragControls={dragControls}
            dragListener={false} // Disable auto-drag from anywhere, rely on controls
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            dragElastic={0.2}
            // Layout Classes
            className={`
                bg-white shadow-2xl pointer-events-auto overflow-hidden absolute
                
                // Mobile Portrait
                w-full max-w-lg mx-auto left-0 right-0 rounded-t-3xl
                bottom-0 
                ${isMobilePortrait ? 'z-20 rounded-t-none' : 'z-40'}

                // Tablet (md)
                md:w-96 md:rounded-2xl md:bottom-24 md:left-4 md:right-auto md:max-w-none md:top-auto

                // Landscape (Phone/Tablet)
                landscape:left-0 landscape:top-0 landscape:bottom-20 landscape:w-80 landscape:rounded-r-2xl landscape:rounded-l-none landscape:border-r landscape:border-gray-100
                landscape:md:bottom-24 landscape:md:left-4 landscape:md:w-96 landscape:md:rounded-2xl landscape:md:top-auto landscape:md:border-none
            `}
            style={{
              // Heights
              height: isMobilePortrait
                ? activeTab === 'my-places'
                  ? '100dvh' // Full screen for My Places
                  : 'auto'
                : activeTab === 'my-places'
                  ? 'calc(100vh - 100px)'
                  : 'auto',
              maxHeight: isMobilePortrait
                ? activeTab === 'my-places'
                  ? '100dvh'
                  : '80vh'
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
                  : '50px'
                : '16px',

              // If My Places is active on non-mobile, push it up higher
              ...(!isMobilePortrait && activeTab === 'my-places'
                ? { top: '80px', bottom: 'auto' }
                : {}),
            }}
          >
            {/* Drag Handle - Always visible on Mobile Portrait */}
            {isMobilePortrait && (
              <div
                className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none z-10 relative bg-white"
                onPointerDown={(e) => dragControls.start(e)}
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
              style={{ touchAction: 'pan-y' }}
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
                  onLocationSelect={(loc: SavedLocation) => {
                    onLocationSelect(loc);
                    setActiveTab(null);
                  }}
                  themeColor={themeColor}
                  themeBg={themeBg}
                />
              )}
              {activeTab === 'chat' && (
                <ChatbotContent
                  themeColor={themeColor}
                  userLocation={currentLocation || undefined}
                  onRecommendationReceived={(result) => {
                    console.log('Recommendation:', result);
                  }}
                  onClose={() => setActiveTab(null)}
                />
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
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[9999] flex justify-center">
        <div
          className={`
            w-full bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] 
            px-6 py-2 pb-5 pointer-events-auto flex items-center justify-between relative
            
            // Floating on Tablet/Desktop
            md:max-w-3xl md:rounded-full md:bottom-2 md:mb-0 md:shadow-2xl md:border md:border-gray-100 md:bg-white/90 md:backdrop-blur-xl md:px-10 md:py-4 md:h-20
            
            // Landscape Phone: slightly lower height/padding
            landscape:py-2 landscape:pb-3
        `}
        >
          {/* 1. Heart / Recommend (Far Left) */}
          <button
            onClick={() => {
              toggleFavoritesMode();
              lottieRef.current?.goToAndPlay(0);
            }}
            className={`flex flex-col items-center gap-1 transition-all active:scale-95 px-2 w-[72px] relative ${
              isFavoritesMode
                ? themeColor
                : 'text-gray-400 hover:cursor-pointer'
            }`}
          >
            {/* Lottie Container - Absolute to be larger but centered */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[35%] w-16 h-16 pointer-events-none transition-all duration-300 ${
                  isFavoritesMode ? '' : 'grayscale opacity-60'
                }`}
                style={{
                  width: '90px',
                  height: '90px',
                }}
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={heartIcon}
                  loop={false}
                  autoplay={false}
                />
              </div>
            </div>
            <span
              className={`text-[10px] font-medium z-10 ${isFavoritesMode ? 'font-bold' : ''}`}
            >
              찜/추천
            </span>
          </button>

          {/* 2. Reference Location */}
          <NavButton
            icon={<MapPin size={24} />}
            label="기준위치"
            isActive={activeTab === 'location'}
            onClick={() => handleTabClick('location')}
            themeColor={themeColor}
          />

          {/* 3. AI Chatbot */}
          <NavButton
            icon={<Bot size={24} />}
            label="AI 챗봇"
            isActive={activeTab === 'chat'}
            onClick={() => handleTabClick('chat')}
            themeColor={themeColor}
          />

          {/* 4. My Places */}
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
      className={`flex flex-col items-center gap-1 transition-all active:scale-95 px-2 w-[72px] relative ${isActive ? themeColor : 'text-gray-400 hover:cursor-pointer'}`}
    >
      <div className="w-7 h-7 flex items-center justify-center relative">
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
          className={`absolute bottom-[10px] w-1 h-1 rounded-full ${themeColor.replace('text-', 'bg-')}`}
        />
      )}
    </button>
  );
}

// --- Content Subcomponents ---

interface SpotDetailContentProps extends ContentProps {
  spot: SpotCard;
  distance?: number;
  onClose: () => void;
  onViewCard: () => void;
  onRouteSelect: (action: RouteAction) => void;
  hasStart: boolean;
  hasEnd: boolean;
  isCollapsed: boolean;
  hideCloseButton?: boolean;
}

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
}: SpotDetailContentProps) {
  const formatDistance = (m?: number) => {
    if (!m) return '';
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${m}m`;
  };

  if (isCollapsed) {
    return (
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between gap-3 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate max-w-[140px]">
              {spot.title}
            </h2>
            {distance && (
              <>
                <span className="text-gray-300">|</span>
                <span
                  className={`font-bold text-sm ${themeColor} whitespace-nowrap`}
                >
                  {formatDistance(distance)}
                </span>
              </>
            )}
          </div>

          {/* Minimized Direct Route Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRouteSelect('fast');
            }}
            className={`shrink-0 w-10 h-10 rounded-full ${themeBg} text-white shadow-md active:scale-95 flex items-center justify-center`}
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

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2 mb-1">
            {[spot.category_1, spot.category_2, spot.category_3]
              .filter((cat): cat is string => !!cat)
              .filter((cat, idx, self) => self.indexOf(cat) === idx) // Deduplicate
              .slice(0, 3)
              .map((cat, idx) => {
                let label = cat;
                if (
                  (cat === 'FESTIVAL' || cat === 'EVENT') &&
                  spot.festivalcontents
                ) {
                  try {
                    const fd = JSON.parse(spot.festivalcontents);
                    const format = (d: string) =>
                      `${d.substring(4, 6)}.${d.substring(6, 8)}`;
                    label = `${cat} ${format(fd.st_dt)}~${format(fd.ed_dt)}`;
                  } catch {
                    // ignore
                  }
                }
                return (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600"
                  >
                    {label}
                  </span>
                );
              })}
          </div>

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
          <span className="whitespace-nowrap">자세히 보기</span>
        </button>
        <button
          onClick={() => onRouteSelect('fast')}
          className="bg-orange-50 text-orange-600 border border-orange-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 active:scale-95 transition-all"
        >
          <Navigation size={18} />
          <span className="whitespace-nowrap">바로 안내</span>
        </button>
      </div>

      <div className="flex gap-2 pb-[20px]">
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

interface RouteBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'red' | 'green';
}

function RouteBtn({ icon, label, onClick, color, disabled }: RouteBtnProps) {
  const colors = {
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

interface LocationSettingContentProps extends ContentProps {
  currentLocation: Coordinates | null;
  onSelectCurrentLocation: () => void;
  onLocationSelect: (loc: SavedLocation) => void;
}

function LocationSettingContent({
  currentLocation: _currentLocation,
  onSelectCurrentLocation,
  onLocationSelect,
  themeBg,
}: LocationSettingContentProps) {
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
            {savedLocations.map((loc) => (
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

function Trash2Icon(
  props: React.SVGProps<SVGSVGElement> & { size?: number | string }
) {
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

// --- Date Formatting Helper ---
function formatDateGroup(dateStr: string): string {
  if (!dateStr) return '날짜 미상';
  const date = new Date(dateStr);
  const now = new Date();

  // Reset hours for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return '이번 주';
  if (diffDays < 30) return '이번 달';

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

// --- My Places Content with Tabs ---
function MyPlacesContent({
  onSpotClick,
}: {
  onSpotClick: (spot: SpotCard) => void;
}) {
  const [activeTab, setActiveTab] = useState<'places' | 'courses' | 'profile'>(
    'places'
  );
  const [favorites, setFavorites] = useState<FavoriteSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userId, setUserId, mode } = useUserStore();

  const themeColor = mode === 'pet' ? 'text-ormi-green-600' : 'text-orange-600';
  const themeBg = mode === 'pet' ? 'bg-ormi-green-500' : 'bg-orange-500';
  const themeRing = mode === 'pet' ? 'ring-ormi-green-500' : 'ring-orange-500';
  const themeBorder =
    mode === 'pet' ? 'border-ormi-green-500' : 'border-orange-500';

  useEffect(() => {
    if (activeTab === 'places') {
      const load = async () => {
        setIsLoading(true);
        try {
          const res = await FavoritesAPI.getFavorites({
            user_id: userId,
          });
          // Sort by favorite_created_at descending (newest first)
          const sorted = (res.data || []).sort((a, b) => {
            const dateA = new Date(a.favorite_created_at || 0).getTime();
            const dateB = new Date(b.favorite_created_at || 0).getTime();
            return dateB - dateA;
          });
          setFavorites(sorted);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [activeTab, userId]);

  // Group favorites by date
  const groupedFavorites = favorites.reduce(
    (groups, spot) => {
      const groupKey = formatDateGroup(spot.favorite_created_at);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(spot);
      return groups;
    },
    {} as Record<string, FavoriteSpot[]>
  );

  const groupKeys = Object.keys(groupedFavorites);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-100 px-4 pt-2">
        <button
          onClick={() => setActiveTab('places')}
          className={`px-3 py-3 text-sm font-bold relative transition-colors ${
            activeTab === 'places' ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          장소
          {activeTab === 'places' && (
            <motion.div
              layoutId="myplaces-tab"
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeBg}`}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-3 py-3 text-sm font-bold relative transition-colors ${
            activeTab === 'courses' ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          코스
          {activeTab === 'courses' && (
            <motion.div
              layoutId="myplaces-tab"
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeBg}`}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-3 text-sm font-bold relative transition-colors flex items-center gap-1.5 ${
            activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          <User size={14} />
          프로필
          {activeTab === 'profile' && (
            <motion.div
              layoutId="myplaces-tab"
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeBg}`}
            />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {activeTab === 'places' ? (
          isLoading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : favorites.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Heart size={40} className="text-gray-200" />
              <p>아직 찜한 장소가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupKeys.map((dateStr) => (
                <div key={dateStr}>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 ml-1 flex items-center gap-2">
                    {dateStr}
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">
                      {groupedFavorites[dateStr].length}
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {groupedFavorites[dateStr].map((spot) => (
                      <button
                        key={spot.content_id}
                        onClick={() => onSpotClick(spot)}
                        className="text-left group relative aspect-square rounded-xl overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <img
                          src={spot.first_image || ''}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement>
                          ) => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/60 via-black/30 to-transparent">
                          <div className="text-white font-normal text-sm truncate drop-shadow-md">
                            {spot.title}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'courses' ? (
          <CoursesTabContent />
        ) : (
          <ProfileTabContent
            userId={userId}
            setUserId={setUserId}
            themeColor={themeColor}
            themeBg={themeBg}
            themeRing={themeRing}
            themeBorder={themeBorder}
          />
        )}
      </div>
    </div>
  );
}

// --- Courses Tab Content ---
function CoursesTabContent() {
  const { courses } = useCourseHistoryStore();
  const { mode } = useUserStore();
  const themeBg = mode === 'pet' ? 'bg-ormi-green-500' : 'bg-orange-500';
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Group courses by date
  const groupedCourses = courses.reduce(
    (groups: Record<string, Course[]>, course: Course) => {
      const groupKey = formatDateGroup(course.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(course);
      return groups;
    },
    {} as Record<string, Course[]>
  );

  const groupKeys = Object.keys(groupedCourses);

  if (courses.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <MapPin size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          저장된 코스가 없습니다
        </h3>
        <p className="text-sm max-w-[200px]">
          길찾기에서 코스를 만들고 저장해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupKeys.map((dateStr) => (
        <div key={dateStr}>
          <h4 className="text-sm font-bold text-gray-900 mb-3 ml-1 flex items-center gap-2">
            {dateStr}
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">
              {groupedCourses[dateStr].length}
            </span>
          </h4>
          <div className="space-y-3">
            {groupedCourses[dateStr].map((course: Course) => {
              const isExpanded = expandedCourseId === course.id;

              return (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() =>
                    setExpandedCourseId(isExpanded ? null : course.id)
                  }
                >
                  {/* Use Actual Mini Map for Thumbnail */}
                  <div className="relative w-full h-40 overflow-hidden bg-gray-100">
                    <CourseThumbnailMap spots={course.spots} />

                    {/* Overlay Gradient & Badge */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
                      <div className="text-white text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        {course.spots.length}개 장소
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-bold text-gray-900 text-base flex-1 pr-2">
                        {course.title}
                      </h5>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0"
                      >
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Collapsible Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 mb-3">
                            {course.spots.map((spot, idx: number) => (
                              <div
                                key={spot.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                    spot.type === 'start'
                                      ? 'bg-blue-500'
                                      : spot.type === 'end'
                                        ? 'bg-red-500'
                                        : themeBg
                                  }`}
                                >
                                  {spot.type === 'start'
                                    ? '출'
                                    : spot.type === 'end'
                                      ? '도'
                                      : idx}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-gray-500 mb-0.5">
                                    {spot.type === 'start'
                                      ? '출발지'
                                      : spot.type === 'end'
                                        ? '도착지'
                                        : `경유지 ${idx}`}
                                  </div>
                                  <div className="font-medium text-gray-900 truncate">
                                    {spot.name}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Date */}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(course.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Profile Tab Content ---
interface ProfileTabContentProps {
  userId: number;
  setUserId: (userId: number) => void;
  themeColor: string;
  themeBg: string;
  themeRing: string;
  themeBorder: string;
}

function ProfileTabContent({
  userId,
  setUserId,
  themeColor: _themeColor,
  themeBg,
  themeRing,
  themeBorder: _themeBorder,
}: ProfileTabContentProps) {
  // Profile data state
  const [nickname, setNickname] = useState('');
  const [withChild, setWithChild] = useState(false);
  const [withPet, setWithPet] = useState(false);
  const [childAgeGroup, setChildAgeGroup] = useState<ChildAgeGroup | ''>('');
  const [strollerYn, setStrollerYn] = useState<StrollerYN | ''>('');
  const [travelStyle, setTravelStyle] = useState<TravelStyle | ''>('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState(userId);

  // Load profile data
  const loadProfile = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await UserAPI.getUserInfo(id);
      const userData = Array.isArray(res.data) ? res.data[0] : res.data;
      if (userData) {
        setNickname(userData.user_name || '');
        setWithChild(userData.with_child === 1);
        setWithPet(userData.with_pet === 1);
        setChildAgeGroup(userData.child_age_group || '');
        setStrollerYn(userData.stroller_yn || '');
        setTravelStyle(userData.travel_style || '');
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
      setError('프로필을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const effectiveUserId = userId || 1;
    loadProfile(effectiveUserId);
    setPendingUserId(effectiveUserId);
  }, [userId]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload: UserUpdatePayload = {
        user_name: nickname,
        with_child: withChild ? 1 : 0,
        with_pet: withPet ? 1 : 0,
      };

      if (childAgeGroup) payload.child_age_group = childAgeGroup;
      if (strollerYn) payload.stroller_yn = strollerYn;
      if (travelStyle) payload.travel_style = travelStyle;

      // If user ID changed, update it first
      if (pendingUserId !== userId) {
        setUserId(pendingUserId);
      }

      await UserAPI.updateUser(pendingUserId, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to save profile:', e);
      setError('프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle user ID change
  const handleUserIdChange = (newId: number) => {
    setPendingUserId(newId);
  };

  // Apply pending user ID
  const applyUserId = () => {
    if (pendingUserId !== userId) {
      setUserId(pendingUserId);
    }
  };

  // Child age group options
  const childAgeOptions: { value: ChildAgeGroup; label: string }[] = [
    { value: 'INFANT', label: '영유아 (0~2세)' },
    { value: 'TODDLER', label: '유아 (3~5세)' },
    { value: 'KID', label: '초등 (6세 이상)' },
  ];

  // Travel style options
  const travelStyleOptions: { value: TravelStyle; label: string }[] = [
    { value: 'ACTIVE', label: '액티브' },
    { value: 'RELAX', label: '휴식' },
    { value: 'EDU', label: '교육' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 size={32} className="animate-spin mb-3" />
        <span>프로필 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dev User Selector */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            🔧 개발용 유저 선택
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_USER_IDS.map((id) => (
            <button
              key={id}
              onClick={() => handleUserIdChange(id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                pendingUserId === id
                  ? `${themeBg} text-white ring-2 ${themeRing} ring-offset-2`
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              유저 {id}
            </button>
          ))}
        </div>
        {pendingUserId !== userId && (
          <button
            onClick={applyUserId}
            className={`mt-3 w-full py-2 ${themeBg} text-white text-sm font-bold rounded-lg active:scale-95 transition-all`}
          >
            유저 {pendingUserId}(으)로 변경
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Nickname */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          닉네임
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${themeRing} transition-all`}
          placeholder="닉네임을 입력하세요"
        />
      </div>

      {/* With Child Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👶</span>
          <span className="font-bold text-gray-900">아이 동반</span>
        </div>
        <button
          onClick={() => setWithChild(!withChild)}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            withChild ? themeBg : 'bg-gray-200'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              withChild ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Child Age Group - Only show if with child */}
      {withChild && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            아이 연령대
          </label>
          <div className="grid grid-cols-3 gap-2">
            {childAgeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setChildAgeGroup(childAgeGroup === opt.value ? '' : opt.value)
                }
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                  childAgeGroup === opt.value
                    ? `${themeBg} text-white`
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroller - Only show if with child */}
      {withChild && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            유모차 사용
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setStrollerYn(strollerYn === 'Y' ? '' : 'Y')}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                strollerYn === 'Y'
                  ? `${themeBg} text-white`
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>🛒</span> 예
            </button>
            <button
              onClick={() => setStrollerYn(strollerYn === 'N' ? '' : 'N')}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                strollerYn === 'N'
                  ? `${themeBg} text-white`
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              아니오
            </button>
          </div>
        </div>
      )}

      {/* With Pet Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐕</span>
          <span className="font-bold text-gray-900">반려동물 동반</span>
        </div>
        <button
          onClick={() => setWithPet(!withPet)}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            withPet ? themeBg : 'bg-gray-200'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              withPet ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Travel Style */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          여행 스타일
        </label>
        <div className="grid grid-cols-3 gap-2">
          {travelStyleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                setTravelStyle(travelStyle === opt.value ? '' : opt.value)
              }
              className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${
                travelStyle === opt.value
                  ? `${themeBg} text-white`
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full py-4 ${themeBg} text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
      >
        {isSaving ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            저장 중...
          </>
        ) : saveSuccess ? (
          <>
            <Check size={20} />
            저장 완료!
          </>
        ) : (
          <>
            <Save size={20} />
            수정 완료
          </>
        )}
      </button>
    </div>
  );
}
