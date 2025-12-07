/**
 * ProfileService
 * Handles user profile operations
 */

import type { UserProfile, UserProfileInput } from '../types/auth';
import {
  validateAccessibilityConditions,
  validateNickname,
  validateSpotCategories,
} from '../utils/validation';
import { storageService } from './StorageService';

export class ProfileService {
  /**
   * Retrieves user profile
   * @param ciValue - Cognito Identity Value
   * @returns UserProfile or null if not found
   */
  getProfile(ciValue: string): UserProfile | null {
    return storageService.getProfile(ciValue);
  }

  /**
   * Creates a new user profile
   * @param ciValue - Cognito Identity Value
   * @param profileInput - Profile data
   * @returns Created UserProfile
   * @throws Error if validation fails
   */
  createProfile(ciValue: string, profileInput: UserProfileInput): UserProfile {
    // Validate input
    const nicknameValidation = validateNickname(profileInput.nickname);
    if (!nicknameValidation.isValid) {
      throw new Error(nicknameValidation.error);
    }

    const categoriesValidation = validateSpotCategories(
      profileInput.preferredCategories
    );
    if (!categoriesValidation.isValid) {
      throw new Error(categoriesValidation.error);
    }

    const conditionsValidation = validateAccessibilityConditions(
      profileInput.accessibilityConditions
    );
    if (!conditionsValidation.isValid) {
      throw new Error(conditionsValidation.error);
    }

    // Create profile with timestamps
    const now = new Date().toISOString();
    const profile: UserProfile = {
      ciValue,
      nickname: profileInput.nickname.trim(),
      preferredCategories: profileInput.preferredCategories,
      accessibilityConditions: profileInput.accessibilityConditions,
      profileImage: profileInput.profileImage,
      createdAt: now,
      updatedAt: now,
    };

    // Store profile
    storageService.setProfile(profile);

    return profile;
  }

  /**
   * Updates an existing user profile
   * @param ciValue - Cognito Identity Value
   * @param updates - Partial profile data to update
   * @returns Updated UserProfile
   * @throws Error if profile not found or validation fails
   */
  updateProfile(
    ciValue: string,
    updates: Partial<UserProfileInput>
  ): UserProfile {
    // Get existing profile
    const existingProfile = this.getProfile(ciValue);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Validate updates
    if (updates.nickname !== undefined) {
      const nicknameValidation = validateNickname(updates.nickname);
      if (!nicknameValidation.isValid) {
        throw new Error(nicknameValidation.error);
      }
    }

    if (updates.preferredCategories !== undefined) {
      const categoriesValidation = validateSpotCategories(
        updates.preferredCategories
      );
      if (!categoriesValidation.isValid) {
        throw new Error(categoriesValidation.error);
      }
    }

    if (updates.accessibilityConditions !== undefined) {
      const conditionsValidation = validateAccessibilityConditions(
        updates.accessibilityConditions
      );
      if (!conditionsValidation.isValid) {
        throw new Error(conditionsValidation.error);
      }
    }

    // Create updated profile
    const updatedProfile: UserProfile = {
      ...existingProfile,
      nickname: updates.nickname?.trim() ?? existingProfile.nickname,
      preferredCategories:
        updates.preferredCategories ?? existingProfile.preferredCategories,
      accessibilityConditions:
        updates.accessibilityConditions ??
        existingProfile.accessibilityConditions,
      profileImage:
        updates.profileImage !== undefined
          ? updates.profileImage
          : existingProfile.profileImage,
      updatedAt: new Date().toISOString(),
    };

    // Store updated profile
    storageService.setProfile(updatedProfile);

    return updatedProfile;
  }

  /**
   * Deletes a user profile
   * @param ciValue - Cognito Identity Value
   */
  deleteProfile(ciValue: string): void {
    storageService.clearProfile(ciValue);
  }

  /**
   * Checks if a user profile is complete
   * @param ciValue - Cognito Identity Value
   * @returns true if profile exists and is complete, false otherwise
   */
  isProfileComplete(ciValue: string): boolean {
    const profile = this.getProfile(ciValue);

    if (!profile) {
      return false;
    }

    // Check if all required fields are present and valid
    return (
      !!profile.nickname &&
      profile.nickname.length >= 2 &&
      profile.nickname.length <= 20 &&
      Array.isArray(profile.preferredCategories) &&
      profile.preferredCategories.length > 0
    );
  }
}

// Export singleton instance
export const profileService = new ProfileService();
