'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { LogOut, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ExitRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ExitRoute({ children, fallback }: ExitRouteProps) {
  const { isExitUser, isReentryUser, isAdmin, isAuthenticated, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Éviter les redirections multiples
    if (redirecting) return;

    if (!isLoading && !isAuthenticated) {
      setRedirecting(true);
      // Utiliser un délai pour éviter les conflits sur Android
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } else if (!isLoading && isAuthenticated && !isExitUser && !isReentryUser && !isAdmin) {
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    }
  }, [isExitUser, isReentryUser, isAdmin, isAuthenticated, isLoading, redirecting]);

  // Vérification de sécurité pour éviter les boucles infinies
  useEffect(() => {
    if (!isLoading && !redirecting) {
      const safetyTimer = setTimeout(() => {
        if (isLoading) {
          console.warn('ExitRoute loading state stuck - forcing reset');
          setRedirecting(false);
        }
      }, 3000);

      return () => clearTimeout(safetyTimer);
    }
  }, [isLoading, redirecting]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Vérification des permissions..." />
      </div>
    );
  }

  if (!isAuthenticated || redirecting) {
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