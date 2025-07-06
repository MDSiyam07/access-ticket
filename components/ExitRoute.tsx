'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect } from 'react';
import { LogOut, ArrowRight } from 'lucide-react';

interface ExitRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ExitRoute({ children, fallback }: ExitRouteProps) {
  const { isExitUser, isReentryUser, isAdmin, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    } else if (!isLoading && isAuthenticated && !isExitUser && !isReentryUser && !isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isExitUser, isReentryUser, isAdmin, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!isExitUser && !isReentryUser && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-gold-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès Sorties Seulement
          </h2>
          <p className="text-gray-600 mb-6">
            Cette page est réservée aux contrôleurs de sortie, ré-entrée et administrateurs. Vous n&apos;avez pas les permissions nécessaires.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gold-600 text-white py-2 px-4 rounded-lg hover:bg-gold-700 transition-colors flex items-center justify-center gap-2"
          >
            Retour au tableau de bord
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 