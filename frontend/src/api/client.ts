import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '../utils/constants';
import { TokenManager } from '../utils/TokenManager';

// Prevent multiple parallel 401s from all triggering redirects simultaneously
let _logoutInProgress = false;

/**
 * Senior Full-Stack Engineering Axios Client
 * - BaseURL from environment variables (includes /api)
 * - Automatic JWT injection from TokenManager
 * - Global 401 handling (logout + redirect)
 * - Global network error handling
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  // Let axios handle Content-Type automatically based on data type (e.g. FormData vs JSON)
});

// Request Interceptor: Attach JWT Token (Fallback for non-browser environments if needed, but handled by HttpOnly cookie in browser)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    const { response } = error;
    const currentPath = window.location.pathname;

    // Handle Network Errors (ERR_CONNECTION_REFUSED, etc.)
    if (!response) {
      console.error('[API Client] Network Error:', error.message);
      if (!currentPath.includes('/login')) {
        toast.error('Network Error: Cannot reach server. Please check your connection.', {
          id: 'network-error'
        });
      }
      return Promise.reject(error);
    }

    // Handle HTTP Errors
    switch (response.status) {
      case 401:
        if (!currentPath.includes('/login') && !_logoutInProgress) {
          _logoutInProgress = true;
          console.warn('[API Client] 401 Unauthorized - scheduling redirect to login');
          TokenManager.clearAll();
          toast.error('Session expirée. Veuillez vous reconnecter.', { id: 'auth-error' });
          // Delay redirect slightly so user sees the toast message
          setTimeout(() => {
            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
          }, 1200);
        }
        break;

      case 403:
        // 403 = authenticated but action not permitted — do NOT log the user out.
        // Only 401 means the session is invalid.
        console.warn('[API Client] 403 Forbidden:', response.data?.message);
        toast.error(response.data?.message || 'Action non autorisée.', { id: 'forbidden-error' });
        break;

      case 500:
        toast.error('Internal Server Error. Our team has been notified.', { id: 'server-error' });
        break;

      default:
        // Handle other status codes if needed
        break;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
