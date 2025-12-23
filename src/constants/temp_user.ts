// Available user IDs for development/testing
export const AVAILABLE_USER_IDS = [1, 2, 3, 4, 5] as const;
export type AvailableUserId = (typeof AVAILABLE_USER_IDS)[number];

// Storage key for localStorage
const USER_ID_STORAGE_KEY = 'ormi_family_user_id';

// Get saved user ID from localStorage, or default to 1
export const getSavedUserId = (): number => {
  if (typeof window === 'undefined') return 1;
  const saved = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (AVAILABLE_USER_IDS.includes(parsed as AvailableUserId)) {
      return parsed;
    }
  }
  return 1;
};

// Save user ID to localStorage
export const saveUserId = (userId: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
  }
};

// Default exported constant (for backwards compatibility - reads from storage)
export const TEMP_USER_ID = getSavedUserId();

export const getTempUser = () => {
  return {
    id: getSavedUserId(),
    name: 'Test User',
  };
};
