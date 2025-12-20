import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';
import type { SpotCard } from '@/types/spot';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SavedLocation {
  id: string;
  name: string;
  coordinates: Coordinates;
}

interface MapState {
  // UI State
  isMapMode: boolean;
  focusedSpotIndex: number;
  showOnboarding: boolean;
  notifications: Array<{ id: string; content: string }>;

  // Data State
  allSpots: SpotCard[];
  manualLocation: Coordinates | null;
  savedLocations: SavedLocation[];

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

  addSavedLocation: (location: SavedLocation) => void;
  removeSavedLocation: (id: string) => void;

  setStartPoint: (point: RoutePoint | null) => void;
  setEndPoint: (point: RoutePoint | null) => void;
  setWayPoints: (
    points: RoutePoint[] | ((prev: RoutePoint[]) => RoutePoint[])
  ) => void;
  setRoutePath: (path: Coordinates[] | null) => void;
  setRouteSummary: (summary: { distance: number; time: number } | null) => void;
  resetRoute: () => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      // UI State
      isMapMode: false,
      focusedSpotIndex: 0,
      showOnboarding: false,
      notifications: [],

      // Data State
      allSpots: [],
      manualLocation: null,
      savedLocations: [],

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
      },

      addSavedLocation: (location) =>
        set((state) => {
          const exists = state.savedLocations.some(
            (l) =>
              l.coordinates.lat === location.coordinates.lat &&
              l.coordinates.lon === location.coordinates.lon
          );
          if (exists) return state;

          const newLocations = [location, ...state.savedLocations].slice(0, 5);
          return { savedLocations: newLocations };
        }),

      removeSavedLocation: (id) =>
        set((state) => ({
          savedLocations: state.savedLocations.filter((l) => l.id !== id),
        })),

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
    }),
    {
      name: 'map-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        manualLocation: state.manualLocation,
        savedLocations: state.savedLocations,
        // We probably don't want to persist UI state or route state across reloads?
        // User said "Maintain reference location across reloads".
        // manualLocation and savedLocations are the key ones.
      }),
    }
  )
);
