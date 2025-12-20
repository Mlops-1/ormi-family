import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';
import type { SpotCard } from '@/types/spot';
import { create } from 'zustand';

interface MapState {
  // UI State
  isMapMode: boolean;
  focusedSpotIndex: number;
  showOnboarding: boolean;
  notifications: Array<{ id: string; content: string }>;

  // Data State
  allSpots: SpotCard[];
  manualLocation: Coordinates | null;

  // Routing State
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  wayPoints: RoutePoint[];
  routePath: Coordinates[] | null;
  routeSummary: { distance: number; time: number } | null;

  // Actions
  setMapMode: (mode: boolean) => void;
  setFocusedSpotIndex: (index: number) => void;
  setShowOnboarding: (show: boolean) => void;
  addNotification: (content: string) => void;
  removeNotification: (id: string) => void;

  setAllSpots: (spots: SpotCard[] | ((prev: SpotCard[]) => SpotCard[])) => void;
  setManualLocation: (loc: Coordinates | null) => void;

  setStartPoint: (point: RoutePoint | null) => void;
  setEndPoint: (point: RoutePoint | null) => void;
  setWayPoints: (
    points: RoutePoint[] | ((prev: RoutePoint[]) => RoutePoint[])
  ) => void;
  setRoutePath: (path: Coordinates[] | null) => void;
  setRouteSummary: (summary: { distance: number; time: number } | null) => void;
  resetRoute: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  // UI State
  isMapMode: false,
  focusedSpotIndex: 0,
  showOnboarding: false,
  notifications: [],

  // Data State
  allSpots: [],
  manualLocation: null,

  // Routing State
  startPoint: null,
  endPoint: null,
  wayPoints: [],
  routePath: null,
  routeSummary: null,

  // Actions
  setMapMode: (mode) => set({ isMapMode: mode }),
  setFocusedSpotIndex: (index) => set({ focusedSpotIndex: index }),
  setShowOnboarding: (show) => set({ showOnboarding: show }),

  addNotification: (content) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { id, content }],
    }));
    // Auto remove after 3s (optional, but good DX)
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 3000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setAllSpots: (spots) =>
    set((state) => ({
      allSpots: typeof spots === 'function' ? spots(state.allSpots) : spots,
    })),

  setManualLocation: (loc) => {
    set({ manualLocation: loc });
    // Also trigger notification
    // (Note: we can't call addNotification easily from here without `get().addNotification`, so let's just duplicates logic or leave it to component)
  },

  setStartPoint: (point) => set({ startPoint: point }),
  setEndPoint: (point) => set({ endPoint: point }),
  setWayPoints: (points) =>
    set((state) => ({
      wayPoints:
        typeof points === 'function' ? points(state.wayPoints) : points,
    })),
  setRoutePath: (path) => set({ routePath: path }),
  setRouteSummary: (summary) => set({ routeSummary: summary }),

  resetRoute: () =>
    set({
      startPoint: null,
      endPoint: null,
      wayPoints: [],
      routePath: null,
      routeSummary: null,
    }),
}));
