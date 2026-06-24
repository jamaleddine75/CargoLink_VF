import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated, getDashboardPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Determine the correct login portal based on the attempted path
  const isAdminPath = location.pathname.startsWith('/admin');
  const loginPath = isAdminPath ? '/admin/login' : '/login';

  if (!isAuthenticated) {
    // Redirect to the appropriate login page, saving the location they were trying to access
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Cross-segment redirection:
  // If the user is an Admin but trying to access a Client/Driver path
  // OR if the user is a Client/Driver but trying to access an Admin path
  const isAuthorized = allowedRoles.includes(user?.role as UserRole);

  if (!isAuthorized) {
    // Instead of showing a static "Access Denied" page, we redirect them to THEIR natural home
    const homePath = getDashboardPath(user?.role as string);
    console.warn(`Unauthorized access attempt to ${location.pathname} by role ${user?.role}. Redirecting to ${homePath}`);
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
