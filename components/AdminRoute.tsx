'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminRoute({ children, fallback }: AdminRouteProps) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin, isAuthenticated, isLoading]);

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

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès Refusé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 