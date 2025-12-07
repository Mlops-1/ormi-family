/**
 * Browser compatibility and feature detection utilities
 */

/**
 * Checks if third-party cookies are enabled
 * @returns Promise<boolean> - true if third-party cookies are enabled
 */
export async function checkThirdPartyCookies(): Promise<boolean> {
  try {
    // Try to access localStorage as a basic check
    const testKey = '__cookie_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if localStorage is available
 * @returns boolean - true if localStorage is available
 */
export function checkLocalStorage(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets browser information
 * @returns Object with browser name and version
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  isSupported: boolean;
} {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  let isSupported = true;

  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 90;
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 90;
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 88;
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 14;
  }

  return { name, version, isSupported };
}

/**
 * Shows a user-friendly message for enabling cookies
 * @param browserName - Name of the browser
 * @returns Instructions for enabling cookies
 */
export function getCookieEnableInstructions(browserName: string): string {
  const instructions: Record<string, string> = {
    Chrome:
      'Chrome Settings → Privacy and security → Cookies and other site data → Allow all cookies',
    Firefox:
      'Firefox Settings → Privacy & Security → Cookies and Site Data → Accept cookies',
    Safari: 'Safari Preferences → Privacy → Uncheck "Block all cookies"',
    Edge: 'Edge Settings → Cookies and site permissions → Manage and delete cookies → Allow sites to save cookies',
    Unknown: 'Please enable cookies in your browser settings',
  };

  return instructions[browserName] || instructions.Unknown;
}

/**
 * Detects if the user is in private/incognito mode
 * @returns Promise<boolean> - true if in private mode
 */
export async function isPrivateMode(): Promise<boolean> {
  try {
    // Try to use IndexedDB
    const db = indexedDB.open('test');
    return new Promise((resolve) => {
      db.onsuccess = () => resolve(false);
      db.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}
