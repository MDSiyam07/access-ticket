'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';


interface ManualEntryRouteProps {
  children: React.ReactNode;
}

export default function ManualEntryRoute({ children }: ManualEntryRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Vérification des permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
} 