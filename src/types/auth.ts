/**
 * Authentication and User Profile Types
 */

/**
 * Spot categories that users can prefer
 */
export const SpotCategory = {
  CAFE: 'CAFE',
  LANDMARK: 'LANDMARK',
  DINNER: 'DINNER',
} as const;

export type SpotCategory = (typeof SpotCategory)[keyof typeof SpotCategory];

/**
 * Accessibility conditions for users
 */
export const AccessibilityCondition = {
  WHEELCHAIR: 'WHEELCHAIR',
  WITH_CHILDREN: 'WITH_CHILDREN',
  WITH_ELDERLY: 'WITH_ELDERLY',
} as const;

export type AccessibilityCondition =
  (typeof AccessibilityCondition)[keyof typeof AccessibilityCondition];

/**
 * User profile data structure
 */
export interface UserProfile {
  ciValue: string; // Cognito Identity Value
  nickname: string; // 2-20 characters
  preferredCategories: SpotCategory[]; // One or more categories
  accessibilityConditions: AccessibilityCondition[]; // Zero or more conditions
  profileImage?: string; // Base64 or URL
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Input data for creating or updating user profile
 */
export interface UserProfileInput {
  nickname: string;
  preferredCategories: SpotCategory[];
  accessibilityConditions: AccessibilityCondition[];
  profileImage?: string;
}

/**
 * Authentication data stored in browser
 */
export interface AuthData {
  ciValue: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // Unix timestamp
}

/**
 * Authentication result from Cognito
 */
export interface AuthResult {
  success: boolean;
  ciValue?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Cognito user information
 */
export interface CognitoUser {
  username: string;
  attributes: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}
