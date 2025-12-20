import {
  type DragEndEvent,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  LocateFixed,
  MapPin,
  Navigation,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { RoutePoint } from '@/types/map';

interface Props {
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  wayPoints: RoutePoint[];
  onWaypointsChange: (points: RoutePoint[]) => void;
  onRemovePoint: (id: string) => void;
  onSearch: () => void;
  onReset: () => void;
  summary?: { distance: number; time: number } | null;
  isDogMode?: boolean;
  onSetStartToMyLoc?: () => void;
}

interface SortableItemProps {
  id: string;
  name: string;
  onRemove: () => void;
}

function SortableWaypoint({ id, name, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-white border-b border-gray-100 ${
        isDragging ? 'shadow-lg bg-gray-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 touch-none"
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500 block mb-0.5">경유지</span>
        <div className="font-medium text-gray-800 text-sm truncate">{name}</div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default function RouteNavigation({
  startPoint,
  endPoint,
  wayPoints,
  onWaypointsChange,
  onRemovePoint,
  onSearch,
  onReset,
  isDogMode = false,
  onSetStartToMyLoc,
  summary,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse when route summary is available (route calculated)
  useEffect(() => {
    if (summary) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [summary]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const themeColor = isDogMode ? 'text-ormi-green-600' : 'text-orange-500';
  const themeBg = isDogMode ? 'bg-ormi-green-600' : 'bg-orange-500';
  const themeHover = isDogMode
    ? 'hover:bg-ormi-green-700'
    : 'hover:bg-orange-600';

  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec}초`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}분`;
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return `${hrs}시간 ${mins}분`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = wayPoints.findIndex((p) => p.id === active.id);
      const newIndex = wayPoints.findIndex((p) => p.id === over.id);
      onWaypointsChange(arrayMove(wayPoints, oldIndex, newIndex));
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-xl border border-gray-100 overflow-hidden flex flex-col w-full max-w-3xl mx-auto pointer-events-auto transition-all duration-300">
      {/* Collapsed View */}
      {isCollapsed && summary && startPoint && endPoint ? (
        <div
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`font-bold ${themeColor} whitespace-nowrap`}>
              {formatTime(summary.time)}
            </div>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <div className="flex items-center gap-1.5 text-sm text-gray-800 min-w-0 font-medium">
              <span className="truncate max-w-[80px]">{startPoint.name}</span>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
              {wayPoints.length > 0 && (
                <>
                  <span className="text-xs text-gray-500 shrink-0">
                    경유 {wayPoints.length}
                  </span>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </>
              )}
              <span className="truncate max-w-[80px]">{endPoint.name}</span>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400 ml-2" />
        </div>
      ) : (
        /* Expanded View */
        <>
          {/* Header Actions (Collapse) */}
          {summary && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-full flex items-center justify-center pt-1 pb-0.5 text-gray-300 hover:text-gray-500"
            >
              <div className="w-8 h-1 rounded-full bg-gray-200" />
            </button>
          )}

          {/* Start Point */}
          <div className="flex items-center gap-2.5 p-2.5 border-b border-gray-100 leading-tight">
            <MapPin size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-blue-500 font-bold block mb-0.5">
                출발
              </span>
              {startPoint ? (
                <div className="font-medium text-gray-900 text-sm truncate">
                  {startPoint.name}
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-gray-400 text-sm">
                    출발지를 선택하세요
                  </span>
                  {onSetStartToMyLoc && (
                    <button
                      onClick={onSetStartToMyLoc}
                      className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                    >
                      <LocateFixed size={10} />내 위치
                    </button>
                  )}
                </div>
              )}
            </div>
            {startPoint && (
              <div className="flex items-center gap-1">
                {onSetStartToMyLoc && startPoint.id !== 'user-loc' && (
                  <button
                    onClick={onSetStartToMyLoc}
                    className="p-1 text-blue-400 hover:text-blue-600 mr-1"
                    title="내 위치로 설정"
                  >
                    <LocateFixed size={14} />
                  </button>
                )}
                <button
                  onClick={() => onRemovePoint(startPoint.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Draggable Waypoints */}
          <div className="max-h-32 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={wayPoints.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {wayPoints.map((point) => (
                  <SortableWaypoint
                    key={point.id}
                    id={point.id}
                    name={point.name}
                    onRemove={() => onRemovePoint(point.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* End Point */}
          <div className="flex items-center gap-2.5 p-2.5 border-b border-gray-100 leading-tight">
            <MapPin size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-red-500 font-bold block mb-0.5">
                도착
              </span>
              {endPoint ? (
                <div className="font-medium text-gray-900 text-sm truncate">
                  {endPoint.name}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">도착지를 선택하세요</div>
              )}
            </div>
            {endPoint && (
              <button
                onClick={() => onRemovePoint(endPoint.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-2.5 bg-gray-50/50">
            <button
              onClick={onReset}
              className={`pl-2 pr-2 py-1.5 text-[11px] font-bold ${themeColor} hover:bg-gray-100/80 rounded-lg transition-colors flex items-center gap-1`}
            >
              초기화
            </button>
            <button
              onClick={onSearch}
              disabled={!startPoint || !endPoint}
              className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-full text-sm font-bold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors active:scale-95 ${themeBg} ${themeHover}`}
            >
              <Navigation size={14} />
              Tmap 안내
            </button>
          </div>
        </>
      )}
    </div>
  );
}
