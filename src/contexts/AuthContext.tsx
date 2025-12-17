/**
 * AuthContext
 * Provides authentication state and methods throughout the application
 */

import { createContext, type ReactNode, useEffect, useState } from 'react';
import { profileService } from '../services/ProfileService';
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
   * Restores authentication session
   * Simplified to check for local mock session
   */
  const restoreSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedUser = localStorage.getItem('mock_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));

        // Load profile if exists
        // simplified for now, assuming if user exists, we might have profile
        // logic for profile can stay if it uses local storage
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to restore session:', err);
      setLoading(false);
    }
  };

  /**
   * Initiates Google login -> Mock Login as User 1
   */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      // Mock user 1
      const mockUser: CognitoUser = {
        username: 'user-1',
        attributes: {
          sub: '1', // user_id 1
          email: 'user1@ormi.com',
          name: 'User 1',
        },
      };

      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));

      // Also set a mock token so axios interceptors don't complain if they look for it
      localStorage.setItem('token', 'mock-token-user-1');
    } catch (err) {
      setError('Failed to login');
    }
  };

  /**
   * Initiates X login
   */
  const loginWithX = async () => {
    // Same behavior for X for now
    await loginWithGoogle();
  };

  /**
   * Logs out the current user
   */
  const logout = async () => {
    localStorage.removeItem('mock_user');
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  /**
   * Refreshes profile data from storage
   */
  const refreshProfile = () => {
    // keep as is or simplified if needed
    // const authData = storageService.getAuthData();
    // if (authData) {
    //   const userProfile = profileService.getProfile(authData.ciValue);
    //   setProfile(userProfile);
    // }
  };

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Token refresh disabled
  /*
  useEffect(() => {
     ...
  }, [user]);
  */

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
