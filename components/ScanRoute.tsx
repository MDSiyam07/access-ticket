'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ScanRouteProps {
  children: React.ReactNode;
}

export default function ScanRoute({ children }: ScanRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Chargement du scanner..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
} 