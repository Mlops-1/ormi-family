/**
 * StorageService
 * Handles browser localStorage operations for authentication and profile data
 */

import type { AuthData, UserProfile } from '../types/auth';

const AUTH_DATA_KEY = 'auth_data';
const PROFILE_KEY_PREFIX = 'user_profile_';

export class StorageService {
  /**
   * Stores authentication data in localStorage
   * @param ciValue - Cognito Identity Value
   * @param tokens - Authentication tokens
   */
  setAuthData(
    ciValue: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      idToken: string;
      expiresIn: number;
    }
  ): void {
    try {
      const authData: AuthData = {
        ciValue,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
      };

      localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(authData));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(
          'Storage quota exceeded. Please clear some browser data.'
        );
      }
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Retrieves authentication data from localStorage
   * @returns AuthData or null if not found or invalid
   */
  getAuthData(): AuthData | null {
    try {
      const data = localStorage.getItem(AUTH_DATA_KEY);
      if (!data) {
        return null;
      }

      const authData: AuthData = JSON.parse(data);

      // Validate data structure
      if (
        !authData.ciValue ||
        !authData.accessToken ||
        !authData.refreshToken ||
        !authData.idToken ||
        !authData.expiresAt
      ) {
        console.warn('Invalid auth data structure, clearing storage');
        this.clearAuthData();
        return null;
      }

      return authData;
    } catch (error) {
      console.error('Failed to retrieve auth data:', error);
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Clears authentication data from localStorage
   */
  clearAuthData(): void {
    try {
      localStorage.removeItem(AUTH_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Stores user profile in localStorage
   * @param profile - User profile data
   */
  setProfile(profile: UserProfile): void {
    try {
      const key = `${PROFILE_KEY_PREFIX}${profile.ciValue}`;
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(
          'Storage quota exceeded. Please clear some browser data.'
        );
      }
      throw new Error('Failed to store profile data');
    }
  }

  /**
   * Retrieves user profile from localStorage
   * @param ciValue - Cognito Identity Value
   * @returns UserProfile or null if not found or invalid
   */
  getProfile(ciValue: string): UserProfile | null {
    try {
      const key = `${PROFILE_KEY_PREFIX}${ciValue}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const profile: UserProfile = JSON.parse(data);

      // Validate data structure
      if (
        !profile.ciValue ||
        !profile.nickname ||
        !profile.preferredCategories ||
        !Array.isArray(profile.preferredCategories) ||
        !profile.accessibilityConditions ||
        !Array.isArray(profile.accessibilityConditions) ||
        !profile.createdAt ||
        !profile.updatedAt
      ) {
        console.warn('Invalid profile data structure, clearing storage');
        this.clearProfile(ciValue);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Failed to retrieve profile data:', error);
      this.clearProfile(ciValue);
      return null;
    }
  }

  /**
   * Clears user profile from localStorage
   * @param ciValue - Cognito Identity Value
   */
  clearProfile(ciValue: string): void {
    try {
      const key = `${PROFILE_KEY_PREFIX}${ciValue}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear profile data:', error);
    }
  }

  /**
   * Clears all user data (auth and profile) from localStorage
   */
  clearAllUserData(): void {
    const authData = this.getAuthData();
    if (authData) {
      this.clearProfile(authData.ciValue);
    }
    this.clearAuthData();
  }

  /**
   * Checks if localStorage is available
   * @returns true if localStorage is available, false otherwise
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
