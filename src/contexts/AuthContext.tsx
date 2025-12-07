/**
 * AuthContext
 * Provides authentication state and methods throughout the application
 */

import { createContext, type ReactNode, useEffect, useState } from 'react';
import { authService } from '../services/AuthService';
import { profileService } from '../services/ProfileService';
import { storageService } from '../services/StorageService';
import type { CognitoUser, UserProfile } from '../types/auth';

interface AuthContextType {
  user: CognitoUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithX: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Restores authentication session on app load
   */
  const restoreSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if storage is available
      if (!storageService.isStorageAvailable()) {
        setError(
          'Browser storage is not available. Please enable cookies and site data in your browser settings.'
        );
        setLoading(false);
        return;
      }

      // Initialize Cognito first
      authService.initializeCognito();

      // Check if user is authenticated with Cognito
      // Bypass for mock demo user
      const currentAuthData = storageService.getAuthData();
      const isMockUser = currentAuthData?.ciValue === 'demo-user-1';

      let isAuth = false;
      if (isMockUser) {
        isAuth = true;
      } else {
        isAuth = await authService.isAuthenticated();
      }

      if (!isAuth) {
        // No active Cognito session, clear local storage
        storageService.clearAllUserData();
        setLoading(false);
        return;
      }

      // Get current user from Cognito (or mock)
      let currentUser: CognitoUser | null = null;

      if (isMockUser) {
        currentUser = {
          username: 'demo-user-1',
          attributes: {
            sub: 'demo-user-1',
            email: 'demo@example.com',
            name: 'Demo User',
          },
        };
      } else {
        currentUser = await authService.getCurrentUser();
      }

      if (!currentUser) {
        storageService.clearAllUserData();
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Get auth data from storage
      const authData = storageService.getAuthData();

      if (authData) {
        // Load profile if we have auth data
        const userProfile = profileService.getProfile(authData.ciValue);
        setProfile(userProfile);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to restore session:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to restore session'
      );
      storageService.clearAllUserData();
      setLoading(false);
    }
  };

  /**
   * Initiates Google login
   */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const result = await authService.loginWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  /**
   * Initiates X login
   */
  const loginWithX = async () => {
    try {
      setError(null);
      const result = await authService.loginWithX();
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  /**
   * Logs out the current user
   */
  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      // Clear state even if logout fails
      setUser(null);
      setProfile(null);
    }
  };

  /**
   * Refreshes profile data from storage
   */
  const refreshProfile = () => {
    const authData = storageService.getAuthData();
    if (authData) {
      const userProfile = profileService.getProfile(authData.ciValue);
      setProfile(userProfile);
    }
  };

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          await authService.refreshSession();
        } catch (err) {
          console.error('Failed to refresh token:', err);
        }
      },
      50 * 60 * 1000
    ); // Refresh every 50 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isProfileComplete: profile
      ? profileService.isProfileComplete(profile.ciValue)
      : false,
    loginWithGoogle,
    loginWithX,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
