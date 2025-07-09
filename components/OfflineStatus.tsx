'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface OfflineStatusProps {
  className?: string;
}

export default function OfflineStatus({ className = '' }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    // Vérifier le mode standalone (PWA)
    if (typeof window !== 'undefined') {
      // Vérifier si c'est Android
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        diagnostics.push('Android détecté');
      }

      // Vérifier le mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        diagnostics.push('Mode PWA détecté');
      }

      // Vérifier la connectivité
      if (!navigator.onLine) {
        diagnostics.push('Mode hors ligne');
      }

      // Vérifier les capacités de stockage
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          diagnostics.push('localStorage disponible');
        } catch {
          diagnostics.push('localStorage non disponible');
        }
      }

      setDiagnostics(diagnostics);
    }

    // Surveiller la connectivité
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Afficher seulement en mode développement ou si des problèmes sont détectés
  if (true) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        
        {diagnostics.length > 0 && (
          <div className="text-xs text-gray-600 space-y-1">
            {diagnostics.map((diag, index) => (
              <div key={index} className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                {diag}
              </div>
            ))}
          </div>
        )}

        {!isOnline && (
          <div className="mt-2 text-xs text-red-600">
            Certaines fonctionnalités peuvent être limitées
          </div>
        )}
      </div>
    </div>
  );
} 