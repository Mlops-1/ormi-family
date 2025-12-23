import type { ChildAgeGroup, StrollerYN, TravelStyle } from '@/api/user';
import { getSavedUserId, saveUserId } from '@/constants/temp_user';
import { SpotCategory, type CognitoUser, type UserProfile } from '@/types/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserFormState {
  userName: string;
  email: string;
  profileImage: string | null;
  isDisabled: boolean;
  withChild: boolean;
  withPet: boolean;
  hasStroller: boolean;
  selectedCategories: SpotCategory[];
  // New profile fields
  childAgeGroup?: ChildAgeGroup;
  strollerYn?: StrollerYN;
  travelStyle?: TravelStyle;
}

interface UserState {
  user: CognitoUser | null;
  profile: UserProfile | null;
  userId: number;
  mode: 'toddler' | 'pet'; // Frontend uses 'toddler', converted to 'baby' for API

  // Form State for User Profile Edit
  editForm: UserFormState;

  // Actions
  setUser: (user: CognitoUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setUserId: (userId: number) => void;
  setMode: (mode: 'toddler' | 'pet') => void;
  logout: () => void;

  // Form Actions
  setEditForm: (form: Partial<UserFormState>) => void;
  resetEditForm: () => void;
}

const INITIAL_FORM_STATE: UserFormState = {
  userName: '',
  email: '',
  profileImage: null,
  isDisabled: false,
  withChild: false,
  withPet: false,
  hasStroller: false,
  selectedCategories: [],
  childAgeGroup: undefined,
  strollerYn: undefined,
  travelStyle: undefined,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      userId: getSavedUserId(),
      mode: 'toddler', // Default
      editForm: INITIAL_FORM_STATE,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setUserId: (userId) => {
        saveUserId(userId);
        set({ userId });
      },
      setMode: (mode) => {
        set({ mode });
      },
      logout: () =>
        set({
          user: null,
          profile: null,
          userId: 1,
          editForm: INITIAL_FORM_STATE,
        }),

      setEditForm: (updates) =>
        set((state) => ({
          editForm: { ...state.editForm, ...updates },
        })),
      resetEditForm: () => set({ editForm: INITIAL_FORM_STATE }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        userId: state.userId,
        mode: state.mode,
        // Do not persist editForm to avoid stale state on reload
      }),
    }
  )
);
