import type { AccessibilityType, SpotCategoryType } from '@/types/spot';
import { SpotCategory } from '@/types/spot';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    (set) => ({
      // Barrier Free State
      barrierOrderedIds: INITIAL_BARRIER_IDS,
      selectedBarrierIds: [], // Default empty
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
      setCategoryOpen: (isOpen) => set({ isCategoryOpen: isOpen }),

      // Theme/Mode Preset Action
      setFiltersForMode: (mode: 'toddler' | 'pet') => {
        if (mode === 'toddler') {
          // Child Mode (Light)
          // Categories: Tourist Spot, Accommodation
          const newCategories = [
            SpotCategory.TOURIST_SPOT,
            SpotCategory.ACCOMMODATION,
          ];

          // Barriers: Stroller (Top), Nursing Room, High Chair, Elevator
          const barrierPriority = [
            'stroller',
            'lactation_room',
            'baby_spare_chair',
            'elevator',
          ] as AccessibilityType[];
          const restBarriers = INITIAL_BARRIER_IDS.filter(
            (id) => !barrierPriority.includes(id)
          );
          const newBarrierOrder = [...barrierPriority, ...restBarriers];

          // Select strictly these 4? Or just ensure they are on?
          // User said: "Right Filter (Amenities): Enable Stroller, Nursing Room, High Chair, Elevator"
          const newSelectedBarriers = [...barrierPriority];

          set({
            selectedCategoryIds: newCategories,
            selectedBarrierIds: newSelectedBarriers,
            barrierOrderedIds: newBarrierOrder,
            isCategoryOpen: false, // Optional: Reset open state or keep as is? User didn't specify, defaulting to closed seems safe
            isBarrierOpen: false,
          });
        } else {
          // Pet Mode (Dark)
          // Categories: Cafe, Restaurant
          const newCategories = [SpotCategory.CAFE, SpotCategory.RESTAURANT];

          // Barriers: Pet Friendly (Top)
          // "help_dog" is likely "Pet Friendly" based on context (AccessibilityType has help_dog)
          // Wait, is "help_dog" actually "Service Dog" or "Pet Friendly"?
          // usually "help_dog" = service dog. But in this app concept, it seems to map to "Pet Friendly" for the dark mode.
          // Let's assume 'help_dog' is the one.
          const barrierPriority = ['help_dog'] as AccessibilityType[];
          const restBarriers = INITIAL_BARRIER_IDS.filter(
            (id) => !barrierPriority.includes(id)
          );
          const newBarrierOrder = [...barrierPriority, ...restBarriers];

          const newSelectedBarriers = [...barrierPriority];

          set({
            selectedCategoryIds: newCategories,
            selectedBarrierIds: newSelectedBarriers,
            barrierOrderedIds: newBarrierOrder,
            isCategoryOpen: false,
            isBarrierOpen: false,
          });
        }
      },
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        // Persist everything including selection
        barrierOrderedIds: state.barrierOrderedIds,
        selectedBarrierIds: state.selectedBarrierIds,
        categoryOrderedIds: state.categoryOrderedIds,
        selectedCategoryIds: state.selectedCategoryIds,
      }),
    }
  )
);
