import type { AccessibilityType, SpotCategoryType } from '@/types/spot';
import { SpotCategory } from '@/types/spot';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterStore {
  // Barrier Free
  barrierOrderedIds: AccessibilityType[];
  selectedBarrierIds: AccessibilityType[];
  setBarrierOrderedIds: (ids: AccessibilityType[]) => void;
  toggleBarrierId: (id: AccessibilityType) => void;
  isBarrierOpen: boolean;
  setBarrierOpen: (isOpen: boolean) => void;

  // Category
  categoryOrderedIds: SpotCategoryType[];
  selectedCategoryIds: SpotCategoryType[];
  setCategoryOrderedIds: (ids: SpotCategoryType[]) => void;
  toggleCategoryId: (id: SpotCategoryType) => void;
  isCategoryOpen: boolean;
  setCategoryOpen: (isOpen: boolean) => void;
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
    (set) => ({
      // Barrier Free State
      barrierOrderedIds: INITIAL_BARRIER_IDS,
      selectedBarrierIds: [], // Default empty
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
      isBarrierOpen: false,
      setBarrierOpen: (isOpen) => set({ isBarrierOpen: isOpen }),

      // Category State
      categoryOrderedIds: INITIAL_CATEGORY_IDS,
      selectedCategoryIds: [
        SpotCategory.TOURIST_SPOT,
        SpotCategory.CAFE,
        SpotCategory.RESTAURANT,
        SpotCategory.ACCOMMODATION,
      ], // Default all selected? Or user said "Category basic open" -> usually means "All selected" or "None filtered"?
      // Map init state was all 4.
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
      isCategoryOpen: true,
      setCategoryOpen: (isOpen) => set({ isCategoryOpen: isOpen }),
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        // Persist everything including selection
        barrierOrderedIds: state.barrierOrderedIds,
        selectedBarrierIds: state.selectedBarrierIds,
        categoryOrderedIds: state.categoryOrderedIds,
        selectedCategoryIds: state.selectedCategoryIds,
        // We can persist open state too if desired, but user might prefer defaults on cold start?
        // User asked "State management so data doesn't leak". Persisting selection is key.
      }),
    }
  )
);
