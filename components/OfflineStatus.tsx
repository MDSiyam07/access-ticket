'use client';

import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    synced: 0,
    failed: 0,
    lastSync: 0,
    isOnline: true
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const online = await offlineStorage.checkConnectivity();
      setIsOnline(online);
      await offlineStorage.updateOnlineStatus(online);
      
      const offlineStats = await offlineStorage.getOfflineStats();
      setStats(offlineStats);
    };

    updateStatus();
    
    // Vérifier la connectivité toutes les 30 secondes
    const interval = setInterval(updateStatus, 30000);
    
    // Écouter les événements de connectivité
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await offlineStorage.syncPendingScans();
      console.log('Synchronisation terminée:', result);
      
      // Mettre à jour les statistiques
      const newStats = await offlineStorage.getOfflineStats();
      setStats(newStats);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return 'Jamais';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  if (isOnline && stats.pending === 0 && stats.failed === 0) {
    return null; // Ne pas afficher si tout va bien
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium text-sm">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
          
          {stats.pending > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          )}
        </div>

        {(stats.pending > 0 || stats.failed > 0) && (
          <div className="space-y-2">
            {stats.pending > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>En attente</span>
                </div>
                <span className="font-medium">{stats.pending}</span>
              </div>
            )}
            
            {stats.failed > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Échoués</span>
                </div>
                <span className="font-medium">{stats.failed}</span>
              </div>
            )}
            
            {stats.synced > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Synchronisés</span>
                </div>
                <span className="font-medium">{stats.synced}</span>
              </div>
            )}
          </div>
        )}

        {stats.lastSync > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Dernière sync: {formatLastSync(stats.lastSync)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 