import type { SpotCard } from '@/types/spot';
import { Flag, Info, MapPin, Navigation, Plus, X } from 'lucide-react';

export type RouteAction = 'fast' | 'start' | 'end' | 'waypoint';

interface Props {
  spot: SpotCard;
  distance?: number;
  onClose: () => void;
  onViewCard: () => void;
  onRouteSelect: (action: RouteAction) => void;
  hasStart: boolean;
  hasEnd: boolean;
  markerTheme?: 'orange' | 'green';
}

export default function SpotInteractionSheet({
  spot,
  distance,
  onClose,
  onViewCard,
  onRouteSelect,
  hasStart,
  hasEnd,
  markerTheme = 'orange',
}: Props) {
  const isDog = markerTheme === 'green';
  const themeColor = isDog ? 'text-ormi-green-600' : 'text-orange-600';
  const buttonEventClass = isDog
    ? 'bg-ormi-green-500 hover:bg-ormi-green-600 active:bg-ormi-green-700'
    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700';

  const formatDistance = (m?: number) => {
    if (!m) return '';
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${m}m`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-300 pb-8 pointer-events-auto">
      <div className="p-4 flex flex-col gap-3">
        {/* Header: Title & Close */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-lg font-bold text-gray-900 truncate leading-tight">
              {spot.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <MapPin size={12} className={themeColor} />
              <span className="truncate max-w-[200px]">
                {spot.addr_1 || spot.addr_2 || '주소 정보 없음'}
              </span>
              {distance && (
                <>
                  <span className="w-0.5 h-3 bg-gray-200 shrink-0" />
                  <span className={`font-medium ${themeColor} shrink-0`}>
                    {formatDistance(distance)}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mt-1.5 -mr-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Row: Mixed Layout for Compactness */}
        <div className="flex gap-2">
          {/* Main Action: View Card */}
          <button
            onClick={onViewCard}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 ${buttonEventClass}`}
          >
            <Info size={16} />
            <span>카드 상세</span>
          </button>

          {/* Fast Route Action (Highlighted) */}
          <button
            onClick={() => onRouteSelect('fast')}
            className="px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm border border-orange-100 bg-orange-50 text-orange-600 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Navigation size={16} />
            <span>바로 안내</span>
          </button>
        </div>

        {/* Secondary Routes: Horizontal Stack */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-1">
          <RouteActionButton
            icon={<Flag size={18} />}
            label={hasStart ? '출발 변경' : '출발지'}
            colorClass="text-blue-600 bg-blue-50 hover:bg-blue-100"
            onClick={() => onRouteSelect('start')}
          />
          <RouteActionButton
            icon={<MapPin size={18} />}
            label={hasEnd ? '도착 변경' : '도착지'}
            colorClass="text-red-600 bg-red-50 hover:bg-red-100"
            onClick={() => onRouteSelect('end')}
          />
          <RouteActionButton
            icon={<Plus size={18} />}
            label="경유지"
            colorClass="text-green-600 bg-green-50 hover:bg-green-100"
            onClick={() => onRouteSelect('waypoint')}
            disabled={!hasStart && !hasEnd}
          />
        </div>
      </div>
    </div>
  );
}

function RouteActionButton({
  icon,
  label,
  colorClass,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-all active:scale-95 gap-1 ${
        disabled ? 'opacity-40 grayscale pointer-events-none' : ''
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${colorClass}`}
      >
        {icon}
      </div>
      <span className="text-[10px] font-medium text-gray-500 text-center leading-none">
        {label}
      </span>
    </button>
  );
}
