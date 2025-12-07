/**
 * useProfile Hook
 * Provides profile management functionality
 */

import { useState } from 'react';
import { profileService } from '../services/ProfileService';
import { storageService } from '../services/StorageService';
import type { UserProfileInput } from '../types/auth';
import { useAuth } from './useAuth';

export function useProfile() {
  const { profile, refreshProfile } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates a new profile
   */
  const createProfile = async (profileInput: UserProfileInput) => {
    try {
      setUpdating(true);
      setError(null);

      const authData = storageService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }

      profileService.createProfile(authData.ciValue, profileInput);
      refreshProfile();

      setUpdating(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      setUpdating(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Updates the current profile
   */
  const updateProfile = async (updates: Partial<UserProfileInput>) => {
    try {
      setUpdating(true);
      setError(null);

      const authData = storageService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }

      profileService.updateProfile(authData.ciValue, updates);
      refreshProfile();

      setUpdating(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      setUpdating(false);
      throw new Error(errorMessage);
    }
  };

  return {
    profile,
    updating,
    error,
    createProfile,
    updateProfile,
  };
}
