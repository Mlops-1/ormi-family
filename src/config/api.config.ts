// Production API configuration
// In production, API calls should go through CloudFront or directly to the backend
// This file helps manage environment-specific API URLs

const isProd = import.meta.env.PROD;

interface ApiEndpoints {
  backend: string;
  tmap: string;
  chatbot: string;
}

// Development: Uses Vite proxy (defined in vite.config.ts)
// Production: Uses direct URLs or CloudFront paths
export const API_ENDPOINTS: ApiEndpoints = {
  // Main backend API
  backend: isProd
    ? import.meta.env.VITE_API_BASE_URL || 'https://api.yourdomain.com'
    : '', // Empty string uses Vite proxy in dev

  // TMap API (if called directly)
  tmap: 'https://apis.openapi.sk.com',

  // Chatbot API
  chatbot: isProd
    ? 'https://shkzgaiq8b.execute-api.ap-northeast-2.amazonaws.com'
    : '', // Uses Vite proxy in dev
};

// Helper function to build API URLs
export const buildApiUrl = (
  endpoint: keyof ApiEndpoints,
  path: string
): string => {
  const baseUrl = API_ENDPOINTS[endpoint];
  return `${baseUrl}${path}`;
};

// Environment info for debugging
export const ENV_INFO = {
  isProd,
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL,
};
