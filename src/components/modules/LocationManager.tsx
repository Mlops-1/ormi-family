import { useFilterStore } from '@/store/filterStore';
import { useMapStore } from '@/store/mapStore';
import { useUserStore } from '@/store/userStore';
import type { Coordinates } from '@/types/geo';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Trash2, X } from 'lucide-react';
import { useRef } from 'react';

// Simple useClickOutside to close the widget when clicking outside
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

import React from 'react';

// Icon import for location pin
const LocationPinIcon = ({ className }: { className?: string }) => (
  // Use lucide MapPin but we can style or swap if needed.
  // The user requested: "위치모양 아이콘으로 해서 흰색 아이콘에 각 테마의 메인컬러를 쓰게 하면 되겠습니다."
  // Which means: White icon, Main Theme Color background.
  <MapPin className={`w-5 h-5 text-white ${className}`} />
);

interface Props {
  currentLocation: Coordinates | null;
  onSelectCurrentLocation: () => void;
}

export default function LocationManager({
  currentLocation,
  onSelectCurrentLocation,
}: Props) {
  const { isLocationOpen: isOpen, setLocationOpen: setIsOpen } =
    useFilterStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    savedLocations,
    manualLocation,
    setManualLocation,
    removeSavedLocation,
  } = useMapStore();
  const { mode } = useUserStore(); // 'toddler' (orange) or 'pet' (green)

  // Theme colors
  const mainColorClass = mode === 'pet' ? 'bg-ormi-green-500' : 'bg-orange-500';
  const hoverColorClass =
    mode === 'pet' ? 'hover:bg-ormi-green-600' : 'hover:bg-orange-600';
  const textColorClass =
    mode === 'pet' ? 'text-ormi-green-600' : 'text-orange-600';
  const borderColorClass =
    mode === 'pet' ? 'border-ormi-green-200' : 'border-orange-200';

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleLocationClick = (loc: { coordinates: Coordinates }) => {
    setManualLocation(loc.coordinates);
    setIsOpen(false);
  };

  // Check if active
  const isCurrentActive = !manualLocation && !!currentLocation;
  // If manualLocation is null, we are using current GPS location (implicit)
  // Or explicitly checking coordinates match
  const isManualActive = (lat: number, lon: number) =>
    manualLocation &&
    Math.abs(manualLocation.lat - lat) < 0.0001 &&
    Math.abs(manualLocation.lon - lon) < 0.0001;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${mainColorClass} ${hoverColorClass} w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors`}
        aria-label="기준 위치 설정"
      >
        <LocationPinIcon />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-xl border ${borderColorClass} overflow-hidden z-50 flex flex-col`}
          >
            <div className="p-3 border-b border-gray-100 font-bold text-gray-800 flex justify-between items-center">
              <span>기준 위치 설정</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
              {/* Current GPS Location Option */}
              {currentLocation ? (
                <button
                  onClick={onSelectCurrentLocation}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors ${
                    isCurrentActive
                      ? 'bg-gray-100 font-bold'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCurrentActive ? mainColorClass : 'bg-gray-200'}`}
                  >
                    <MapPin size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">
                      현재 위치
                    </div>
                    <div className="text-xs text-gray-500">GPS 기반</div>
                  </div>
                </button>
              ) : (
                <div className="text-xs text-gray-400 p-2 text-center">
                  현재 위치를 가져올 수 없습니다.
                </div>
              )}

              <div className="h-px bg-gray-100 my-1" />

              {/* Saved Locations */}
              {savedLocations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  저장된 위치가 없습니다.
                  <br />
                  지도에서 위치를 선택하면
                  <br />
                  자동으로 추가됩니다.
                </div>
              ) : (
                savedLocations.map((loc) => {
                  const active = isManualActive(
                    loc.coordinates.lat,
                    loc.coordinates.lon
                  );
                  return (
                    <div
                      key={loc.id}
                      className={`group w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors ${
                        active
                          ? 'bg-gray-100 ring-1 ring-inset ring-gray-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        className="flex-1 flex items-center gap-2 min-w-0"
                        onClick={() => handleLocationClick(loc)}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${active ? mainColorClass : 'bg-orange-100 text-orange-500'}`}
                        >
                          <span
                            className={`text-xs font-bold ${active ? 'text-white' : textColorClass}`}
                          >
                            {loc.name.slice(0, 1)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm truncate ${active ? 'font-bold' : ''} text-gray-900`}
                          >
                            {loc.name}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedLocation(loc.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 bg-gray-50 text-[10px] text-gray-400 text-center border-t border-gray-100">
              최대 5개까지 저장됩니다.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
