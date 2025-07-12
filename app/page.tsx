'use client';

import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const { isAuthenticated, isAdmin, isEntryUser, isExitUser, isReentryUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else {
        // Rediriger vers la page appropriée selon le rôle
        let redirectPath = '/dashboard';
        if (isAdmin) {
          redirectPath = '/admin';
        } else if (isEntryUser) {
          redirectPath = '/scan-entry';
        } else if (isExitUser) {
          redirectPath = '/scan-exit';
        } else if (isReentryUser) {
          redirectPath = '/scan-reentry';
        }
        window.location.href = redirectPath;
      }
    }
  }, [isAuthenticated, isAdmin, isEntryUser, isExitUser, isReentryUser, isLoading]);

  // Afficher un loader pendant la vérification
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-modern-violet-50 via-modern-cyan-50 to-modern-violet-100">
      <LoadingSpinner size="md" text="Redirection..." />
    </div>
  );
}