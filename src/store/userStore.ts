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
}

interface UserState {
  user: CognitoUser | null;
  profile: UserProfile | null;
  mode: 'toddler' | 'pet';

  // Form State for User Profile Edit
  editForm: UserFormState;

  // Actions
  setUser: (user: CognitoUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
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
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      mode: 'toddler', // Default
      editForm: INITIAL_FORM_STATE,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setMode: (mode) => {
        set({ mode });

        // Handle Side Effects
        const root = window.document.documentElement;
        if (mode === 'toddler') {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
      },
      logout: () =>
        set({ user: null, profile: null, editForm: INITIAL_FORM_STATE }),

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
        mode: state.mode,
        // Do not persist editForm to avoid stale state on reload
      }),
    }
  )
);
