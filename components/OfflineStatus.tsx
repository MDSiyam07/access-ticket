'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { offlineStorage } from '@/lib/offlineStorage';

interface OfflineStatusProps {
  className?: string;
}

// Le navigateur ne vérifie que l'accès au réseau local (navigator.onLine),
// pas que le serveur est réellement joignable. On revérifie périodiquement
// via une requête réelle, en plus des événements online/offline.
const POLL_INTERVAL = 15000;

export default function OfflineStatus({ className = '' }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, synced: 0, failed: 0 });
  const syncingRef = useRef(false);

  const refreshStats = useCallback(async () => {
    const offlineStats = await offlineStorage.getOfflineStats();
    setStats(offlineStats);
  }, []);

  const trySync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const reachable = await offlineStorage.checkConnectivity();
      setIsOnline(reachable);
      await offlineStorage.updateOnlineStatus(reachable);

      if (reachable) {
        const pending = await offlineStorage.getPendingScans();
        if (pending.length > 0) {
          await offlineStorage.syncPendingScans();
        }
        await offlineStorage.cleanupOldScans();
      }
    } finally {
      await refreshStats();
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
    trySync();

    const handleOnline = () => trySync();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(trySync, POLL_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPending = stats.pending > 0;
  const hasFailed = stats.failed > 0;

  // Rien à signaler : on ne pollue pas l'écran.
  if (isOnline && !hasPending && !hasFailed) {
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

        {hasPending && (
          <div className="text-xs text-blue-600 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" />
            {stats.pending} scan(s) en attente de synchronisation
          </div>
        )}

        {hasFailed && (
          <div className="text-xs text-red-600 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" />
            {stats.failed} scan(s) n&apos;ont pas pu être synchronisés
          </div>
        )}

        {!isOnline && (
          <div className="text-xs text-red-600 mb-2">
            Les scans sont sauvegardés localement et seront synchronisés au retour de la connexion.
          </div>
        )}

        {(hasPending || hasFailed) && (
          <button
            onClick={trySync}
            disabled={isSyncing}
            className="mt-1 w-full flex items-center justify-center gap-1 text-xs bg-modern-cyan-500 text-white rounded-md py-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
          </button>
        )}
      </div>
    </div>
  );
}
