/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication and complete profile
 */

import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean; // If true, requires complete profile
}

export default function ProtectedRoute({
  children,
  requireProfile = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate({ to: '/login' });
      return;
    }

    // Redirect to onboarding if profile is required but incomplete
    if (requireProfile && !isProfileComplete) {
      navigate({ to: '/user' });
      return;
    }
  }, [isAuthenticated, isProfileComplete, loading, requireProfile, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ormi-ember-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if redirecting
  if (!isAuthenticated || (requireProfile && !isProfileComplete)) {
    return null;
  }

  return <>{children}</>;
}
