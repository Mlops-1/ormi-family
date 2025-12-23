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
  'yes_kids',
  'yes_pet',
  'wheelchair',
  'stroller',
  'lactation_room',
  'baby_spare_chair',
  'help_dog',
  'route',
  'elevator',
  'parking',
];

// Toddler Mode: yes_kids at top
export const TODDLER_BARRIER_ORDER: AccessibilityType[] = [
  'yes_kids',
  'stroller',
  'lactation_room',
  'baby_spare_chair',
  'elevator',
  'yes_pet',
  'wheelchair',
  'help_dog',
  'route',
  'parking',
];

// Pet Mode: yes_pet at top
export const PET_BARRIER_ORDER: AccessibilityType[] = [
  'yes_pet',
  'help_dog',
  'yes_kids',
  'wheelchair',
  'stroller',
  'lactation_room',
  'baby_spare_chair',
  'route',
  'elevator',
  'parking',
];

// Initial Category Options
export const TODDLER_CATEGORY_IDS: SpotCategoryType[] = [
  SpotCategory.TOUR_SPOT,
  SpotCategory.ACCOMMODATION,
  SpotCategory.EVENT,
];

export const PET_CATEGORY_IDS: SpotCategoryType[] = [
  SpotCategory.CAFE,
  SpotCategory.FOOD,
  SpotCategory.SHOPPING,
];

// Initial Category Options (Fallback)
export const INITIAL_CATEGORY_IDS: SpotCategoryType[] = [
  ...TODDLER_CATEGORY_IDS,
  ...PET_CATEGORY_IDS,
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
          let barrierOrder: AccessibilityType[] = [];
          let initialSelectedBarriers: AccessibilityType[] = [];
          let initialCategoryIds: SpotCategoryType[] = [];

          if (mode === 'toddler') {
            // Toddler mode: yes_kids at top, ALL categories enabled
            barrierOrder = TODDLER_BARRIER_ORDER;
            initialSelectedBarriers = [
              'yes_kids',
              'stroller',
              'lactation_room',
              'baby_spare_chair',
              'elevator',
            ];
            // Enable ALL category filters for toddler mode
            initialCategoryIds = INITIAL_CATEGORY_IDS;
          } else {
            // Pet mode: yes_pet at top
            barrierOrder = PET_BARRIER_ORDER;
            initialSelectedBarriers = ['yes_pet', 'help_dog'];
            initialCategoryIds = PET_CATEGORY_IDS;
          }

          set({
            selectedCategoryIds: initialCategoryIds,
            selectedBarrierIds: initialSelectedBarriers,
            barrierOrderedIds: barrierOrder,
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
      onRehydrateStorage: () => (state) => {
        // Validation: Ensure selectedCategoryIds is not empty
        if (state) {
          if (
            !state.selectedCategoryIds ||
            state.selectedCategoryIds.length === 0
          ) {
            state.setSelectedCategoryIds(INITIAL_CATEGORY_IDS);
          }
          if (
            !state.categoryOrderedIds ||
            state.categoryOrderedIds.length === 0
          ) {
            state.setCategoryOrderedIds(INITIAL_CATEGORY_IDS);
          }
        }
      },
    }
  )
);
