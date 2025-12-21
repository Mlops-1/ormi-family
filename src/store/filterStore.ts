import type { AccessibilityType, SpotCategoryType } from '@/types/spot';
import { SpotCategory } from '@/types/spot';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeFilterData {
  selectedCategoryIds: SpotCategoryType[];
  selectedBarrierIds: AccessibilityType[];
  barrierOrderedIds: AccessibilityType[];
}

interface FilterStore {
  // Barrier Free
  barrierOrderedIds: AccessibilityType[];
  selectedBarrierIds: AccessibilityType[];
  setSelectedBarrierIds: (ids: AccessibilityType[]) => void;
  setBarrierOrderedIds: (ids: AccessibilityType[]) => void;
  toggleBarrierId: (id: AccessibilityType) => void;
  isBarrierOpen: boolean;
  setBarrierOpen: (isOpen: boolean) => void;

  // Category
  categoryOrderedIds: SpotCategoryType[];
  selectedCategoryIds: SpotCategoryType[];
  setSelectedCategoryIds: (ids: SpotCategoryType[]) => void;
  setCategoryOrderedIds: (ids: SpotCategoryType[]) => void;
  toggleCategoryId: (id: SpotCategoryType) => void;
  isCategoryOpen: boolean;
  setCategoryOpen: (isOpen: boolean) => void;

  // Weather & Location
  isWeatherOpen: boolean;
  setWeatherOpen: (isOpen: boolean) => void;
  isLocationOpen: boolean;
  setLocationOpen: (isOpen: boolean) => void;

  closeAllMenus: () => void;

  // Theme Management
  themeFilters: {
    toddler: ThemeFilterData | null;
    pet: ThemeFilterData | null;
  };
  setFiltersForMode: (mode: 'toddler' | 'pet') => void;
}

// Initial Barrier Options
export const INITIAL_BARRIER_IDS: AccessibilityType[] = [
  'wheelchair',
  'stroller',
  'lactation_room',
  'baby_spare_chair',
  'help_dog',
  'route',
  'elevator',
  'parking',
];

// Initial Category Options
export const INITIAL_CATEGORY_IDS: SpotCategoryType[] = [
  SpotCategory.TOURIST_SPOT,
  SpotCategory.CAFE,
  SpotCategory.RESTAURANT,
  SpotCategory.ACCOMMODATION,
];

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      // Barrier Free State
      barrierOrderedIds: INITIAL_BARRIER_IDS,
      selectedBarrierIds: [],
      setSelectedBarrierIds: (ids) => set({ selectedBarrierIds: ids }),
      setBarrierOrderedIds: (ids) => set({ barrierOrderedIds: ids }),
      toggleBarrierId: (id) =>
        set((state) => {
          const isSelected = state.selectedBarrierIds.includes(id);
          const newSelected = isSelected
            ? state.selectedBarrierIds.filter((i) => i !== id)
            : [...state.selectedBarrierIds, id];

          return {
            selectedBarrierIds: newSelected,
          };
        }),
      // Category State
      categoryOrderedIds: INITIAL_CATEGORY_IDS,
      selectedCategoryIds: INITIAL_CATEGORY_IDS,
      setSelectedCategoryIds: (ids) => set({ selectedCategoryIds: ids }),
      setCategoryOrderedIds: (ids) => set({ categoryOrderedIds: ids }),
      toggleCategoryId: (id) =>
        set((state) => {
          const isSelected = state.selectedCategoryIds.includes(id);
          const newSelected = isSelected
            ? state.selectedCategoryIds.filter((i) => i !== id)
            : [...state.selectedCategoryIds, id];

          return {
            selectedCategoryIds: newSelected,
          };
        }),
      isCategoryOpen: false,
      setCategoryOpen: (isOpen) =>
        set((state) => ({
          isCategoryOpen: isOpen,
          isWeatherOpen: isOpen ? false : state.isWeatherOpen,
          isLocationOpen: isOpen ? false : state.isLocationOpen,
        })),

      // Barrier State Shared
      isBarrierOpen: false,
      setBarrierOpen: (isOpen) =>
        set((state) => ({
          isBarrierOpen: isOpen,
          isWeatherOpen: isOpen ? false : state.isWeatherOpen,
          isLocationOpen: isOpen ? false : state.isLocationOpen,
        })),

      // Weather & Location
      isWeatherOpen: false,
      setWeatherOpen: (isOpen) =>
        set({
          isWeatherOpen: isOpen,
          isLocationOpen: isOpen ? false : false,
          isCategoryOpen: isOpen ? false : false,
          isBarrierOpen: isOpen ? false : false,
        }),
      isLocationOpen: false,
      setLocationOpen: (isOpen) =>
        set({
          isLocationOpen: isOpen,
          isWeatherOpen: isOpen ? false : false,
          isCategoryOpen: isOpen ? false : false,
          isBarrierOpen: isOpen ? false : false,
        }),

      closeAllMenus: () =>
        set({
          isCategoryOpen: false,
          isBarrierOpen: false,
          isWeatherOpen: false,
          isLocationOpen: false,
        }),

      // Theme Management
      themeFilters: {
        toddler: null,
        pet: null,
      },

      setFiltersForMode: (mode: 'toddler' | 'pet') => {
        const state = get();
        const currentMode = mode === 'toddler' ? 'pet' : 'toddler';

        // 1. Save current state to themeFilters for the PREVIOUS mode
        const currentFilterData: ThemeFilterData = {
          selectedCategoryIds: state.selectedCategoryIds,
          selectedBarrierIds: state.selectedBarrierIds,
          barrierOrderedIds: state.barrierOrderedIds,
        };

        const updatedThemeFilters = {
          ...state.themeFilters,
          [currentMode]: currentFilterData,
        };

        // 2. Load or Initialize state for the NEW mode
        const savedFilters = updatedThemeFilters[mode];

        if (savedFilters) {
          // Restore saved filters
          set({
            ...savedFilters,
            themeFilters: updatedThemeFilters,
            isCategoryOpen: false,
            isBarrierOpen: false,
          });
        } else {
          // Initialize for the first time
          let barrierPriority: AccessibilityType[] = [];
          let initialSelectedBarriers: AccessibilityType[] = [];

          if (mode === 'toddler') {
            barrierPriority = [
              'stroller',
              'lactation_room',
              'baby_spare_chair',
              'elevator',
            ];
            initialSelectedBarriers = [...barrierPriority];
          } else {
            barrierPriority = ['help_dog'];
            initialSelectedBarriers = [...barrierPriority];
          }

          const restBarriers = INITIAL_BARRIER_IDS.filter(
            (id) => !barrierPriority.includes(id)
          );
          const newBarrierOrder = [...barrierPriority, ...restBarriers];

          set({
            selectedCategoryIds: INITIAL_CATEGORY_IDS, // First time: All 4 categories
            selectedBarrierIds: initialSelectedBarriers,
            barrierOrderedIds: newBarrierOrder,
            themeFilters: updatedThemeFilters,
            isCategoryOpen: false,
            isBarrierOpen: false,
          });
        }
      },
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        barrierOrderedIds: state.barrierOrderedIds,
        selectedBarrierIds: state.selectedBarrierIds,
        categoryOrderedIds: state.categoryOrderedIds,
        selectedCategoryIds: state.selectedCategoryIds,
        themeFilters: state.themeFilters,
      }),
    }
  )
);
