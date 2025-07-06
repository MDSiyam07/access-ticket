'use client';

import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else {
        // Rediriger vers la page appropriée selon le rôle
        const redirectPath = isAdmin ? '/admin' : '/dashboard';
        window.location.href = redirectPath;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading]);

  // Afficher un loader pendant la vérification
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection...</p>
      </div>
    </div>
  );
}