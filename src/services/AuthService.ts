/**
 * AuthService
 * Handles AWS Cognito authentication operations
 */

import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
  signOut,
} from 'aws-amplify/auth';
import cognitoConfig from '../config/cognito';
import type { AuthResult, CognitoUser } from '../types/auth';
import { storageService } from './StorageService';

export class AuthService {
  private initialized = false;

  /**
   * Initializes AWS Amplify with Cognito configuration
   */
  initializeCognito(): void {
    if (this.initialized) {
      return;
    }

    try {
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: cognitoConfig.userPoolId,
            userPoolClientId: cognitoConfig.userPoolWebClientId,
            loginWith: {
              oauth: {
                domain: cognitoConfig.oauth.domain,
                scopes: cognitoConfig.oauth.scope,
                redirectSignIn: [cognitoConfig.oauth.redirectSignIn],
                redirectSignOut: [cognitoConfig.oauth.redirectSignOut],
                responseType: cognitoConfig.oauth.responseType as 'code',
              },
            },
          },
        },
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Cognito:', error);
      throw new Error('Failed to initialize authentication service');
    }
  }

  /**
   * Initiates Google OAuth login flow
   * @returns Promise<AuthResult>
   */
  async loginWithGoogle(): Promise<AuthResult> {
    try {
      this.initializeCognito();
      await signInWithRedirect({ provider: 'Google' });

      // The redirect happens, so this code won't execute
      // The actual result is handled in the callback route
      return {
        success: true,
      };
    } catch (error) {
      console.error('Google login failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initiate Google login',
      };
    }
  }

  /**
   * Initiates X (Twitter) OAuth login flow
   * @returns Promise<AuthResult>
   */
  async loginWithX(): Promise<AuthResult> {
    try {
      this.initializeCognito();
      await signInWithRedirect({ provider: { custom: 'Twitter' } });

      // The redirect happens, so this code won't execute
      // The actual result is handled in the callback route
      return {
        success: true,
      };
    } catch (error) {
      console.error('X login failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to initiate X login',
      };
    }
  }

  /**
   * Logs out the current user and clears session
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      this.initializeCognito();

      // Sign out from Cognito
      await signOut();

      // Clear local storage
      storageService.clearAllUserData();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if Cognito signOut fails, clear local storage
      storageService.clearAllUserData();
      throw new Error('Failed to logout');
    }
  }

  /**
   * Gets the current authenticated user
   * @returns Promise<CognitoUser | null>
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      this.initializeCognito();

      const user = await getCurrentUser();

      return {
        username: user.username,
        attributes: {
          sub: user.userId,
        },
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Checks if user is authenticated
   * @returns Promise<boolean>
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      this.initializeCognito();

      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch {
      return false;
    }
  }

  /**
   * Refreshes the authentication session
   * @returns Promise<void>
   */
  async refreshSession(): Promise<void> {
    try {
      this.initializeCognito();

      const session = await fetchAuthSession({ forceRefresh: true });

      if (session.tokens) {
        const ciValue = session.tokens.idToken?.payload.sub as string;
        const expiresIn =
          (session.tokens.accessToken?.payload.exp as number) -
          Math.floor(Date.now() / 1000);

        storageService.setAuthData(ciValue, {
          accessToken: session.tokens.accessToken?.toString() || '',
          refreshToken: '', // Amplify handles refresh tokens internally
          idToken: session.tokens.idToken?.toString() || '',
          expiresIn,
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      throw new Error('Failed to refresh authentication session');
    }
  }

  /**
   * Handles OAuth callback and extracts tokens
   * @returns Promise<AuthResult>
   */
  async handleOAuthCallback(): Promise<AuthResult> {
    try {
      this.initializeCognito();

      const session = await fetchAuthSession();

      if (!session.tokens) {
        return {
          success: false,
          error: 'No tokens received from authentication',
        };
      }

      const ciValue = session.tokens.idToken?.payload.sub as string;
      const expiresIn =
        (session.tokens.accessToken?.payload.exp as number) -
        Math.floor(Date.now() / 1000);

      // Store auth data
      storageService.setAuthData(ciValue, {
        accessToken: session.tokens.accessToken?.toString() || '',
        refreshToken: '', // Amplify handles refresh tokens internally
        idToken: session.tokens.idToken?.toString() || '',
        expiresIn,
      });

      return {
        success: true,
        ciValue,
        accessToken: session.tokens.accessToken?.toString(),
        idToken: session.tokens.idToken?.toString(),
        expiresIn,
      };
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle authentication callback',
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
