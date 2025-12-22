import { create } from 'zustand';

interface BottomFilterState {
  activeTab: 'location' | 'chat' | 'my-places' | null;
  isFavoritesMode: boolean; // Controls Recommend vs Favorites
  isCollapsed: boolean; // Controls sliding panel collapse state

  // Actions
  setActiveTab: (tab: 'location' | 'chat' | 'my-places' | null) => void;
  toggleFavoritesMode: () => void;
  setFavoritesMode: (isFav: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  closeAll: () => void;
}

export const useBottomFilterStore = create<BottomFilterState>((set) => ({
  activeTab: null,
  isFavoritesMode: false,
  isCollapsed: false,

  setActiveTab: (tab) =>
    set((state) => ({
      activeTab: state.activeTab === tab ? null : tab,
      isCollapsed: false, // Auto expand when switching tabs
    })),

  toggleFavoritesMode: () =>
    set((state) => ({ isFavoritesMode: !state.isFavoritesMode })),

  setFavoritesMode: (isFav) => set({ isFavoritesMode: isFav }),

  setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

  closeAll: () =>
    set({
      activeTab: null,
      isCollapsed: false,
    }),
}));
