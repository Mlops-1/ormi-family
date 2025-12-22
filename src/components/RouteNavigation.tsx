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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  GripVertical,
  LocateFixed,
  MapPin,
  Navigation,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useCourseHistoryStore } from '@/store/courseHistoryStore';
import { useRouteStore } from '@/store/routeStore';
import { useUserStore } from '@/store/userStore';
import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';

interface Props {
  onSearch: () => void;
  onManualSearch?: () => void;
  isDogMode?: boolean;
  userLocation?: Coordinates | null;
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
  onSearch,
  onManualSearch,
  isDogMode = false,
  userLocation,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showCourseSave, setShowCourseSave] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');

  // Get state and actions from route store
  const {
    startPoint,
    endPoint,
    wayPoints,
    routeSummary,
    routePath, // Get current route path coordinates
    setStartPoint,
    setEndPoint,
    reorderWayPoints,
    removeWayPoint,
    resetRoute,
    swapStartAndEnd,
  } = useRouteStore();

  const { addCourse } = useCourseHistoryStore();
  const { userId } = useUserStore();

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
      const oldIndex = wayPoints.findIndex(
        (p: RoutePoint) => p.id === active.id
      );
      const newIndex = wayPoints.findIndex((p: RoutePoint) => p.id === over.id);
      reorderWayPoints(oldIndex, newIndex);
    }
  };

  const handleSetStartToMyLoc = () => {
    if (userLocation) {
      setStartPoint({
        id: 'user-loc',
        name: '내 위치',
        type: 'start',
        coordinates: userLocation,
      });
    } else {
      alert('현재 위치를 가져올 수 없습니다.');
    }
  };

  const handleRemovePoint = (id: string) => {
    if (startPoint?.id === id) {
      setStartPoint(null);
    } else if (endPoint?.id === id) {
      setEndPoint(null);
    } else {
      removeWayPoint(id);
    }
  };

  // Check if waypoint is duplicate
  const checkDuplicateWaypoint = (newWaypoint: RoutePoint): string | null => {
    const allPoints = [...wayPoints];

    for (let i = 0; i < allPoints.length; i++) {
      const point = allPoints[i];
      if (
        point.coordinates.lat === newWaypoint.coordinates.lat &&
        point.coordinates.lon === newWaypoint.coordinates.lon
      ) {
        return `경유지 ${i + 1}과 같은 위치입니다`;
      }
    }

    return null;
  };

  // Show notification toast
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Save course to history
  const handleSaveCourse = async () => {
    if (!startPoint || !endPoint) {
      showNotification('출발지와 도착지를 설정해주세요');
      return;
    }

    const allSpots: RoutePoint[] = [];
    if (startPoint) allSpots.push(startPoint);
    allSpots.push(...wayPoints);
    if (endPoint) allSpots.push(endPoint);

    const title =
      courseTitle.trim() || `코스 ${new Date().toLocaleDateString()}`;

    // userId should be string in store, but might be passed as number/string here
    // Convert to string safely to match store type
    const userIdStr = userId ? String(userId) : 'guest';

    // Save with actual route path if available
    addCourse(title, allSpots, userIdStr, undefined, routePath);

    showNotification('코스가 저장되었습니다');
    setCourseTitle('');
    setShowCourseSave(false);
  };

  // Auto-hide notification on unmount
  useEffect(() => {
    return () => {
      setNotification(null);
    };
  }, []);

  // Auto-collapse when route is FIRST calculated
  const prevRouteSummaryRef = useRef(routeSummary);
  useEffect(() => {
    // Only collapse if the route summary just appeared or changed
    if (
      routeSummary &&
      (!prevRouteSummaryRef.current ||
        prevRouteSummaryRef.current.time !== routeSummary.time ||
        prevRouteSummaryRef.current.distance !== routeSummary.distance)
    ) {
      const timer = setTimeout(() => setIsCollapsed(true), 100);
      prevRouteSummaryRef.current = routeSummary;
      return () => clearTimeout(timer);
    }
  }, [routeSummary]);

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-xl border border-gray-100 overflow-hidden flex flex-col w-full max-w-3xl mx-auto pointer-events-auto transition-all duration-300">
      {/* Collapsed View */}
      {isCollapsed && routeSummary && startPoint && endPoint ? (
        <div
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`font-bold ${themeColor} whitespace-nowrap`}>
              {formatTime(routeSummary.time)}
            </div>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <div className="flex items-center gap-1.5 text-sm text-gray-800 min-w-0 font-medium">
              <span className="truncate max-w-[80px]">{startPoint.name}</span>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
              {wayPoints.map((wp: RoutePoint) => (
                <div key={wp.id} className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded whitespace-nowrap">
                    {wp.name}
                  </span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              ))}
              <span className="truncate max-w-[80px]">{endPoint.name}</span>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400 ml-2" />
        </div>
      ) : (
        /* Expanded View */
        <>
          {/* Header Actions (Collapse) */}
          {routeSummary && (
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
                  {userLocation && (
                    <button
                      onClick={handleSetStartToMyLoc}
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
                {userLocation && startPoint.id !== 'user-loc' && (
                  <button
                    onClick={handleSetStartToMyLoc}
                    className="p-1 text-blue-400 hover:text-blue-600 mr-1"
                    title="내 위치로 설정"
                  >
                    <LocateFixed size={14} />
                  </button>
                )}
                {startPoint && endPoint && (
                  <button
                    onClick={swapStartAndEnd}
                    className="p-1 text-gray-400 hover:text-blue-500 mr-1"
                    title="출발지/도착지 바꾸기"
                  >
                    <ArrowUpDown size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleRemovePoint(startPoint.id)}
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
                items={wayPoints.map((p: RoutePoint) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {wayPoints.map((point: RoutePoint) => (
                  <SortableWaypoint
                    key={point.id}
                    id={point.id}
                    name={point.name}
                    onRemove={() => handleRemovePoint(point.id)}
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
                onClick={() => handleRemovePoint(endPoint.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-2 p-2.5 bg-gray-50/50">
            {/* Primary Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={resetRoute}
                className={`pl-2 pr-2 py-1.5 text-[11px] font-bold ${themeColor} hover:bg-gray-100/80 rounded-lg transition-colors flex items-center gap-1`}
              >
                초기화
              </button>
              <div className="flex items-center gap-2">
                {onManualSearch && (
                  <button
                    onClick={onManualSearch}
                    disabled={!startPoint || !endPoint}
                    className={`flex items-center gap-1.5 px-3 py-2 text-white rounded-full text-xs font-bold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors active:scale-95 ${themeBg} ${themeHover}`}
                  >
                    길찾기
                  </button>
                )}
                <button
                  onClick={onSearch}
                  disabled={!startPoint || !endPoint}
                  className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-full text-sm font-bold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors active:scale-95 ${themeBg} ${themeHover}`}
                >
                  <Navigation size={14} />
                  Tmap 안내
                </button>
              </div>
            </div>

            {/* Course Save */}
            {startPoint && endPoint && !showCourseSave && (
              <button
                onClick={() => setShowCourseSave(true)}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                이 코스 저장하기
              </button>
            )}

            {showCourseSave && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="코스 이름 (선택)"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleSaveCourse}
                  className={`px-3 py-1.5 text-xs text-white rounded-lg ${themeBg} ${themeHover}`}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setShowCourseSave(false);
                    setCourseTitle('');
                  }}
                  className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] pointer-events-none">
          <div className="bg-gray-900/95 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium animate-fade-in">
            {notification}
          </div>
        </div>
      )}
    </div>
  );
}
