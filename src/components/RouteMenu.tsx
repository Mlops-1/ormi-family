import { Flag, MapPin, Navigation, Plus } from 'lucide-react';

export type RouteMenuOption = 'fast' | 'start' | 'end' | 'waypoint';

interface Props {
  onSelect: (option: RouteMenuOption) => void;
  currentRole?: 'start' | 'end' | 'waypoint' | null; // What this marker currently is
  hasStart: boolean;
  hasEnd: boolean;
  className?: string;
}

export default function RouteMenu({
  onSelect,
  currentRole,
  hasStart,
  hasEnd,
  className = '',
}: Props) {
  // Logic to determine what to show based on user rules
  // Rule 5: If Start/Dest set, show "Set as Waypoint", "Change Start", "Change Dest"
  // Rule 2: Default "Fast Route", "Set Start", "Set End"

  const showFastRoute = !hasStart || !hasEnd; // Generally show unless fully planned, but requirement says "Fast Route" is mostly for immediate action.

  // Implementation strategy: Always show "Fast Route" as a primary action if suitable.
  // "Change Start/End" if already set.

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden min-w-[200px] flex flex-col ${className}`}
    >
      {/* Fast Route - Always available to immediately route from User Location to Here */}
      <button
        onClick={() => onSelect('fast')}
        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <Navigation size={18} />
        </div>
        <div>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm block">
            빠른 길찾기
          </span>
          <span className="text-xs text-gray-400">현 위치에서 바로 안내</span>
        </div>
      </button>

      {/* Set/Change Start */}
      <button
        onClick={() => onSelect('start')}
        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Flag size={18} />
        </div>
        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
          {hasStart ? '출발지로 변경' : '출발지로 설정'}
        </span>
      </button>

      {/* Set/Change End */}
      <button
        onClick={() => onSelect('end')}
        className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <MapPin size={18} />
        </div>
        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
          {hasEnd ? '도착지로 변경' : '도착지로 설정'}
        </span>
      </button>

      {/* Set Waypoint - Only if Start OR Dest is set (implies planning mode) */}
      {(hasStart || hasEnd) && (
        <button
          onClick={() => onSelect('waypoint')}
          className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <Plus size={18} />
          </div>
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
            경유지로 추가
          </span>
        </button>
      )}
    </div>
  );
}
