'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { offlineStorage } from '@/lib/offlineStorage';

export default function OfflinePage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    synced: 0,
    failed: 0
  });

  useEffect(() => {
    const checkConnectivity = async () => {
      const online = await offlineStorage.checkConnectivity();
      setIsOnline(online);
      
      if (online) {
        router.push('/dashboard');
      }
    };

    const updateStats = async () => {
      const offlineStats = await offlineStorage.getOfflineStats();
      setStats(offlineStats);
    };

    checkConnectivity();
    updateStats();

    const interval = setInterval(checkConnectivity, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleRetry = async () => {
    const online = await offlineStorage.checkConnectivity();
    if (online) {
      router.push('/dashboard');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <WifiOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Hors ligne
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n&apos;avez pas de connexion internet. Certaines fonctionnalités peuvent être limitées.
          </p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Mode hors ligne activé
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Vos scans seront sauvegardés localement et synchronisés automatiquement dès que la connexion sera rétablie.
          </p>
        </div>

        {stats.pending > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Scans en attente
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {stats.pending} scan(s) en attente de synchronisation
            </p>
          </div>
        )}

        {stats.failed > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Scans échoués
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {stats.failed} scan(s) n&apos;ont pas pu être synchronisés
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Réessayer la connexion</span>
          </button>

          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>Vérification automatique de la connexion toutes les 5 secondes</p>
        </div>
      </div>
    </div>
  );
} 