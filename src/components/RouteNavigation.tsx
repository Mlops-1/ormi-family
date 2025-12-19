import type { Coordinates } from '@/types/geo';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, LocateFixed, MapPin, Navigation, X } from 'lucide-react';

export interface RoutePoint {
  id: string; // unique id for dnd
  type: 'start' | 'end' | 'waypoint';
  name: string;
  coordinates: Coordinates;
}

interface Props {
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  wayPoints: RoutePoint[];
  onWaypointsChange: (points: RoutePoint[]) => void;
  onRemovePoint: (id: string) => void;
  onSearch: () => void;
  onReset: () => void;
  isDogMode?: boolean;
  onSetStartToMyLoc?: () => void;
  routeInfo?: { totalTime: number; totalDistance: number } | null;
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
  routeInfo,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = wayPoints.findIndex((p) => p.id === active.id);
      const newIndex = wayPoints.findIndex((p) => p.id === over.id);
      onWaypointsChange(arrayMove(wayPoints, oldIndex, newIndex));
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-xl border border-gray-100 overflow-hidden flex flex-col w-full max-w-3xl mx-auto pointer-events-auto">
      {/* Start Point */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <MapPin size={20} className="text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-blue-500 font-bold block mb-0.5">
            출발
          </span>
          {startPoint ? (
            <div className="font-medium text-gray-900 text-sm truncate">
              {startPoint.name}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-400 text-sm">출발지를 선택하세요</span>
              {onSetStartToMyLoc && (
                <button
                  onClick={onSetStartToMyLoc}
                  className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  <LocateFixed size={12} />내 위치
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
                <LocateFixed size={16} />
              </button>
            )}
            <button
              onClick={() => onRemovePoint(startPoint.id)}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Draggable Waypoints */}
      <div className="max-h-40 overflow-y-auto">
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
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <MapPin size={20} className="text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-red-500 font-bold block mb-0.5">
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
            <X size={18} />
          </button>
        )}
      </div>

      {/* Route Info & Actions */}
      <div
        className={`flex items-center justify-between p-3 bg-gray-50 ${routeInfo ? 'pt-2' : ''}`}
      >
        {routeInfo && (
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                {formatTime(routeInfo.totalTime)}
              </span>
              <span className="text-sm text-gray-500">
                ({(routeInfo.totalDistance / 1000).toFixed(1)}km)
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              자동차 기준 (실시간 교통)
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
          >
            초기화
          </button>
          <button
            onClick={onSearch}
            disabled={!startPoint || !endPoint}
            className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-full text-sm font-bold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
              isDogMode
                ? 'bg-ormi-green-600 hover:bg-ormi-green-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <Navigation size={16} />
            안내 시작
          </button>
        </div>
      </div>
    </div>
  );
}
