// frontend/src/utils/constants.ts

/**
 * Strict Environment Configuration
 * - Throws explicit error if VITE_API_URL is missing
 * - Derives WebSocket URL from API URL when VITE_WS_URL is absent
 */

const apiBaseUrl = import.meta.env.VITE_API_URL;
const wsBaseUrl = import.meta.env.VITE_WS_URL;

const deriveWsUrlFromApi = (apiUrl: string): string | null => {
  try {
    // Handle both absolute and relative URLs by using window.location.origin as base
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const parsed = new URL(apiUrl, base);

    // Backend API URL is expected to end with /api; websocket endpoint lives at /ws
    const basePath = parsed.pathname.replace(/\/?api\/?$/, '');
    parsed.pathname = `${basePath}/ws`.replace(/\/\/+/, '/');

    // Convert to ws/wss if it's an absolute URL, otherwise return the relative path
    const result = parsed.toString().replace(/\/$/, '');
    return result.replace(/^http/, 'ws');
  } catch (error) {
    console.error('[Config] Failed to derive WebSocket URL:', error);
    return null;
  }
};

if (!apiBaseUrl) {
  throw new Error('[Critical] VITE_API_URL is not defined. Application cannot proceed.');
}

const resolvedWsBaseUrl = wsBaseUrl || deriveWsUrlFromApi(apiBaseUrl);

if (!wsBaseUrl && resolvedWsBaseUrl) {
  console.warn('[Config] VITE_WS_URL is not defined. Derived WebSocket URL from VITE_API_URL:', resolvedWsBaseUrl);
}

if (!resolvedWsBaseUrl) {
  console.error('[Config] VITE_WS_URL is not defined and could not be derived from VITE_API_URL. WebSocket features will be disabled.');
}

export const API_BASE_URL = apiBaseUrl;
export const WS_BASE_URL = resolvedWsBaseUrl || '';

export const ROLES = {
  ADMIN: 'ADMIN',
  AGENCY_ADMIN: 'AGENCY_ADMIN',
  DRIVER: 'DRIVER',
  CUSTOMER: 'CUSTOMER',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 0,
  SIZE: 10,
} as const;

export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
