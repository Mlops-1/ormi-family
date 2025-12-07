/**
 * Validation utilities for user profile data
 */

import { AccessibilityCondition, SpotCategory } from '../types/auth';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates nickname length (2-20 characters)
 * @param nickname - The nickname to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateNickname(nickname: string): ValidationResult {
  if (!nickname || nickname.trim().length === 0) {
    return {
      isValid: false,
      error: 'Nickname is required',
    };
  }

  const trimmedNickname = nickname.trim();

  if (trimmedNickname.length < 2) {
    return {
      isValid: false,
      error: 'Nickname must be at least 2 characters',
    };
  }

  if (trimmedNickname.length > 20) {
    return {
      isValid: false,
      error: 'Nickname must be at most 20 characters',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates spot categories selection
 * @param categories - Array of selected spot categories
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateSpotCategories(
  categories: SpotCategory[]
): ValidationResult {
  if (!categories || categories.length === 0) {
    return {
      isValid: false,
      error: 'Please select at least one spot category',
    };
  }

  // Check if all categories are valid
  const validCategories = Object.values(SpotCategory);
  const allValid = categories.every((category) =>
    validCategories.includes(category)
  );

  if (!allValid) {
    return {
      isValid: false,
      error: 'Invalid spot category selected',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates accessibility conditions selection
 * @param conditions - Array of selected accessibility conditions
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateAccessibilityConditions(
  conditions: AccessibilityCondition[]
): ValidationResult {
  // Empty array is valid (zero or more conditions)
  if (!conditions) {
    return {
      isValid: false,
      error: 'Accessibility conditions must be an array',
    };
  }

  // Check if all conditions are valid
  const validConditions = Object.values(AccessibilityCondition);
  const allValid = conditions.every((condition) =>
    validConditions.includes(condition)
  );

  if (!allValid) {
    return {
      isValid: false,
      error: 'Invalid accessibility condition selected',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates complete user profile input
 * @param nickname - User's nickname
 * @param categories - Selected spot categories
 * @param conditions - Selected accessibility conditions
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateProfileInput(
  nickname: string,
  categories: SpotCategory[],
  conditions: AccessibilityCondition[]
): ValidationResult {
  const nicknameResult = validateNickname(nickname);
  if (!nicknameResult.isValid) {
    return nicknameResult;
  }

  const categoriesResult = validateSpotCategories(categories);
  if (!categoriesResult.isValid) {
    return categoriesResult;
  }

  const conditionsResult = validateAccessibilityConditions(conditions);
  if (!conditionsResult.isValid) {
    return conditionsResult;
  }

  return {
    isValid: true,
  };
}
