import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeRole } from '../utils/auth.utils';
import { User, UserRole, UserStatus } from '../types';
import { getCurrentUser } from '../services/api/authService';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (token: string) => boolean;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  getDashboardPath: (role: string) => string;
}

interface JwtPayload {
  sub: string;
  id?: string;
  roles: string[];
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  [key: string]: unknown;
}

const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (e) {
    console.error("JWT decode error", e);
    return null;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFullProfile = async (retries = 2) => {
    try {
      const fullUser = await getCurrentUser();
      const normalizedRole = normalizeRole(fullUser.role);
      setUser({
        ...fullUser,
        role: normalizedRole as UserRole,
        isActive: fullUser.active !== undefined ? fullUser.active : true,
        avatarUrl: fullUser.avatarUrl,
      });

    } catch (error: unknown) {
      const status = error?.response?.status;
      const errorMsg = error?.response?.data?.message || error?.message;
      console.error("[Auth] Failed to fetch full user profile", { status, error: errorMsg });

      // Retry once for server errors (5xx)
      if (retries > 0 && status >= 500) {
        console.warn(`[Auth] Server error (${status}), retrying in 1s... (${retries} retries left)`);
        setTimeout(() => {
          fetchFullProfile(retries - 1);
        }, 1000);
        return;
      }

      // Fall back to token-based user data
      const token = localStorage.getItem('token');
      if (token) {
        syncUserFromToken(token);
      } else {
        console.warn('[Auth] No token available for fallback');
      }
    }
  };

  const getDashboardPath = (role: string): string => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'AGENCY_ADMIN':
      case 'AGENCY':  // Accept both AGENCY and AGENCY_ADMIN
        return '/agency/dashboard';
      case 'LIVREUR':
      case 'DRIVER':
        return '/driver/dashboard';
      case 'CLIENT':
      case 'CUSTOMER':
        return '/client/dashboard';
      default:
        console.warn(`Unknown role for dashboard path: ${role}`);
        return '/';
    }
  };

  const syncUserFromToken = (token: string) => {
    const decoded = parseJwt(token);
    if (decoded) {
      // Prefer single 'role' if available (from newer JWT), fall back to normalizing 'roles' array
      const cleanRole = decoded.role ? normalizeRole(decoded.role) : normalizeRole(decoded.roles);
      
      // Prefer the 'id' claim for system-wide UUID identification
      // 'sub' often contains the email, but we need the UUID for API calls
      const userId = decoded.id || (decoded.sub && !decoded.sub.includes('@') ? decoded.sub : '');

      setUser({
        id: userId,
        role: cleanRole as UserRole,
        firstName: decoded.firstName || '',
        lastName: decoded.lastName || '',
        email: decoded.email || (decoded.sub && decoded.sub.includes('@') ? decoded.sub : ''),
        isActive: true,
        status: (decoded.status as UserStatus) || 'ACTIVE',
        agencyId: decoded.agencyId || undefined,
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const success = syncUserFromToken(token);
      // Immediately stop loading if we have a valid token (UI can render)
      if (success) {
        setLoading(false);
        // Then fetch the full profile in background to update the user object
        fetchFullProfile();
      } else {
        setLoading(false);
        console.warn('[Auth] Token found but failed to parse JWT');
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const success = syncUserFromToken(token);
    if (success) {
      fetchFullProfile();
    }
    return success;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      logout, 
      loading, 
      isAuthenticated: !!user,
      getDashboardPath 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
