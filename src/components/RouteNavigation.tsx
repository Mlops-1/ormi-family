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
import { GripVertical, MapPin, Navigation, X } from 'lucide-react';

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

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full max-w-sm mx-auto pointer-events-auto">
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
            <div className="text-gray-400 text-sm">출발지를 선택하세요</div>
          )}
        </div>
        {startPoint && (
          <button
            onClick={() => onRemovePoint(startPoint.id)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <X size={18} />
          </button>
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

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-3 bg-gray-50">
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
        >
          초기화
        </button>
        <button
          onClick={onSearch}
          disabled={!startPoint || !endPoint}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Navigation size={16} />
          길찾기
        </button>
      </div>
    </div>
  );
}
