'use client';

import { useCallback, useEffect, useRef } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';

// Composant silencieux (aucun rendu visuel) : il déclenche la synchronisation
// des scans hors ligne en arrière-plan (retour de connexion + sondage
// périodique) sans jamais afficher de popup à l'utilisateur.

// Le navigateur ne vérifie que l'accès au réseau local (navigator.onLine),
// pas que le serveur est réellement joignable. On revérifie périodiquement
// via une requête réelle, en plus des événements online/offline.
const POLL_INTERVAL = 15000;

export default function OfflineStatus() {
  const syncingRef = useRef(false);

  const trySync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const reachable = await offlineStorage.checkConnectivity();
      await offlineStorage.updateOnlineStatus(reachable);

      if (reachable) {
        const pending = await offlineStorage.getPendingScans();
        if (pending.length > 0) {
          await offlineStorage.syncPendingScans();
        }
        await offlineStorage.cleanupOldScans();
      }
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    trySync();

    window.addEventListener('online', trySync);
    const interval = setInterval(trySync, POLL_INTERVAL);

    return () => {
      window.removeEventListener('online', trySync);
      clearInterval(interval);
    };
  }, [trySync]);

  return null;
}
