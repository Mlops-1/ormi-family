import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';
import { create } from 'zustand';

export interface RouteSummary {
  distance: number;
  time: number;
}

interface RouteState {
  // Route Points
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  wayPoints: RoutePoint[];

  // Route Result
  routePath: Coordinates[] | null;
  routeSummary: RouteSummary | null;

  // Loading State
  isCalculating: boolean;
  error: string | null;

  // Actions
  setStartPoint: (point: RoutePoint | null) => void;
  setEndPoint: (point: RoutePoint | null) => void;
  setWayPoints: (
    points: RoutePoint[] | ((prev: RoutePoint[]) => RoutePoint[])
  ) => void;
  addWayPoint: (point: RoutePoint) => void;
  removeWayPoint: (id: string) => void;
  reorderWayPoints: (oldIndex: number, newIndex: number) => void;

  setRoutePath: (path: Coordinates[] | null) => void;
  setRouteSummary: (summary: RouteSummary | null) => void;
  setIsCalculating: (isCalculating: boolean) => void;
  setError: (error: string | null) => void;

  // Complex Actions
  swapStartAndEnd: () => void;
  convertEndToWaypoint: () => void;
  resetRoute: () => void;

  // Utility
  hasValidRoute: () => boolean;
  getAllPoints: () => RoutePoint[];
}

export const useRouteStore = create<RouteState>()((set, get) => ({
  // Initial State
  startPoint: null,
  endPoint: null,
  wayPoints: [],
  routePath: null,
  routeSummary: null,
  isCalculating: false,
  error: null,

  // Basic Setters
  setStartPoint: (point) => {
    set({ startPoint: point, error: null });
  },

  setEndPoint: (point) => {
    set({ endPoint: point, error: null });
  },

  setWayPoints: (points) =>
    set((state) => ({
      wayPoints:
        typeof points === 'function' ? points(state.wayPoints) : points,
      error: null,
    })),

  addWayPoint: (point) =>
    set((state) => {
      // Check if already at max waypoints
      if (state.wayPoints.length >= 8) {
        return {
          error: '경유지는 최대 8개까지 설정 가능합니다!',
        };
      }

      // Check for duplicate with existing waypoints
      for (let i = 0; i < state.wayPoints.length; i++) {
        const wp = state.wayPoints[i];
        if (
          wp.coordinates.lat === point.coordinates.lat &&
          wp.coordinates.lon === point.coordinates.lon
        ) {
          return {
            error: `경유지 ${i + 1}과 같은 위치입니다`,
          };
        }
      }

      return {
        wayPoints: [...state.wayPoints, point],
        error: null,
      };
    }),

  removeWayPoint: (id) =>
    set((state) => ({
      wayPoints: state.wayPoints.filter((p) => p.id !== id),
      error: null,
    })),

  reorderWayPoints: (oldIndex, newIndex) =>
    set((state) => {
      const newWayPoints = [...state.wayPoints];
      const [removed] = newWayPoints.splice(oldIndex, 1);
      newWayPoints.splice(newIndex, 0, removed);
      return { wayPoints: newWayPoints, error: null };
    }),

  setRoutePath: (path) => set({ routePath: path }),
  setRouteSummary: (summary) => set({ routeSummary: summary }),
  setIsCalculating: (isCalculating) => set({ isCalculating }),
  setError: (error) => set({ error }),

  // Complex Actions
  swapStartAndEnd: () =>
    set((state) => ({
      startPoint: state.endPoint,
      endPoint: state.startPoint,
      error: null,
    })),

  convertEndToWaypoint: () =>
    set((state) => {
      if (!state.endPoint) return state;

      const oldEndAsWaypoint: RoutePoint = {
        ...state.endPoint,
        type: 'waypoint',
        id: `wp-from-end-${Date.now()}`,
      };

      return {
        wayPoints: [...state.wayPoints, oldEndAsWaypoint],
        endPoint: null,
        error: null,
      };
    }),

  resetRoute: () =>
    set({
      startPoint: null,
      endPoint: null,
      wayPoints: [],
      routePath: null,
      routeSummary: null,
      isCalculating: false,
      error: null,
    }),

  // Utility Functions
  hasValidRoute: () => {
    const state = get();
    return !!(state.startPoint && state.endPoint);
  },

  getAllPoints: () => {
    const state = get();
    const points: RoutePoint[] = [];
    if (state.startPoint) points.push(state.startPoint);
    points.push(...state.wayPoints);
    if (state.endPoint) points.push(state.endPoint);
    return points;
  },
}));
