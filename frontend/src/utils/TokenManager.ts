/**
 * TokenManager
 * 
 * Abstracts token handling to prepare the client for HttpOnly cookies.
 * Currently uses localStorage as a fallback since the backend does not yet issue HttpOnly cookies.
 */

export const TokenManager = {
  getToken: (): string | null => {
    return null; // Handled by HttpOnly cookie
  },

  setToken: (token: string): void => {
    // Handled by backend Set-Cookie
  },

  removeToken: (): void => {
    // Handled by backend Set-Cookie max-age=0
  },

  getUser: (): unknown | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser: (user: unknown): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem('user');
  },

  clearAll: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
