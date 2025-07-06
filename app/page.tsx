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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-modern-violet-50 via-modern-cyan-50 to-modern-violet-100">
      <div className="glass-card p-8 text-center floating-animation">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-violet-200 border-t-modern-violet-600 mx-auto pulse-glow"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-modern-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-6 text-lg font-semibold gradient-text">Redirection...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-modern-violet-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-modern-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-modern-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}