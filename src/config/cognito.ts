/**
 * AWS Cognito Configuration
 *
 * This file contains the configuration for AWS Cognito authentication.
 * Replace the placeholder values with your actual Cognito User Pool settings.
 */

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  oauth: {
    domain: string;
    scope: string[];
    redirectSignIn: string;
    redirectSignOut: string;
    responseType: string;
  };
}

const cognitoConfig: CognitoConfig = {
  // AWS Region where your Cognito User Pool is located
  region: import.meta.env.VITE_COGNITO_REGION || 'ap-northeast-2',

  // Cognito User Pool ID (e.g., 'ap-northeast-2_xxxxxxxxx')
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',

  // Cognito App Client ID
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',

  // OAuth configuration
  oauth: {
    // Cognito domain (e.g., 'your-domain.auth.ap-northeast-2.amazoncognito.com')
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',

    // OAuth scopes
    scope: ['openid', 'email', 'profile'],

    // Redirect URL after successful sign-in
    redirectSignIn:
      import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN ||
      'http://localhost:5173/auth/callback',

    // Redirect URL after sign-out
    redirectSignOut:
      import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT ||
      'http://localhost:5173/login',

    // OAuth response type
    responseType: 'code',
  },
};

export default cognitoConfig;
