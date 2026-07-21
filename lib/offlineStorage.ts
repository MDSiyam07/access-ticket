export interface OfflineScan {
  id: string;
  ticketId: string;
  type: 'entry' | 'exit' | 'reentry';
  timestamp: number;
  userId: string;
  userRole: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  lastRetry?: number;
  errorMessage?: string;
}

const SCAN_TYPE_TO_ACTION: Record<OfflineScan['type'], 'ENTER' | 'EXIT' | 'REENTER'> = {
  entry: 'ENTER',
  exit: 'EXIT',
  reentry: 'REENTER',
};

export interface OfflineData {
  scans: OfflineScan[];
  lastSync: number;
  isOnline: boolean;
}

class OfflineStorage {
  private readonly STORAGE_KEY = 'offline_scans';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY = 5000; // 5 secondes

  // Sauvegarder un scan hors ligne
  async saveOfflineScan(scan: Omit<OfflineScan, 'id' | 'status' | 'retryCount'>): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      const newScan: OfflineScan = {
        ...scan,
        id: this.generateId(),
        status: 'pending',
        retryCount: 0
      };
      
      offlineData.scans.push(newScan);
      await this.saveOfflineData(offlineData);
      
      console.log('Scan sauvegardé hors ligne:', newScan);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde hors ligne:', error);
    }
  }

  // Récupérer tous les scans en attente
  async getPendingScans(): Promise<OfflineScan[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.scans.filter(scan => scan.status === 'pending');
  }

  // Marquer un scan comme synchronisé
  async markScanAsSynced(scanId: string): Promise<void> {
    const offlineData = await this.getOfflineData();
    const scanIndex = offlineData.scans.findIndex(scan => scan.id === scanId);
    
    if (scanIndex !== -1) {
      offlineData.scans[scanIndex].status = 'synced';
      await this.saveOfflineData(offlineData);
    }
  }

  // Marquer un scan comme échoué. `permanent` = rejet métier du serveur
  // (ex: billet déjà entré) : inutile de réessayer, on échoue immédiatement.
  async markScanAsFailed(scanId: string, errorMessage?: string, permanent = false): Promise<void> {
    const offlineData = await this.getOfflineData();
    const scanIndex = offlineData.scans.findIndex(scan => scan.id === scanId);

    if (scanIndex !== -1) {
      const scan = offlineData.scans[scanIndex];
      scan.retryCount++;
      scan.lastRetry = Date.now();
      scan.errorMessage = errorMessage;

      if (permanent || scan.retryCount >= this.MAX_RETRY_COUNT) {
        scan.status = 'failed';
      }

      await this.saveOfflineData(offlineData);
    }
  }

  // Supprimer les scans synchronisés anciens (plus de 7 jours)
  async cleanupOldScans(): Promise<void> {
    const offlineData = await this.getOfflineData();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    offlineData.scans = offlineData.scans.filter(scan => 
      scan.status !== 'synced' || scan.timestamp > sevenDaysAgo
    );
    
    await this.saveOfflineData(offlineData);
  }

  // Synchroniser les scans en attente. Protégé contre les appels concurrents
  // (event 'online', polling, bouton manuel peuvent se déclencher en même temps).
  private syncing = false;

  isSyncing(): boolean {
    return this.syncing;
  }

  async syncPendingScans(): Promise<{ success: number; failed: number }> {
    if (this.syncing) {
      return { success: 0, failed: 0 };
    }
    this.syncing = true;

    try {
      const pendingScans = await this.getPendingScans();
      let successCount = 0;
      let failedCount = 0;

      for (const scan of pendingScans) {
        // Respecter le délai de retry pour ne pas marteler le serveur
        if (scan.lastRetry && Date.now() - scan.lastRetry < this.RETRY_DELAY) {
          continue;
        }

        try {
          const response = await fetch('/api/tickets/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketNumber: scan.ticketId,
              action: SCAN_TYPE_TO_ACTION[scan.type],
              entryType: 'SCAN',
              userId: scan.userId,
            }),
          });

          if (response.ok) {
            await this.markScanAsSynced(scan.id);
            successCount++;
          } else {
            const body = await response.json().catch(() => ({}));
            // 4xx = rejet métier du serveur (billet déjà entré/inconnu...) : définitif.
            // 5xx = problème serveur transitoire : on retentera plus tard.
            const permanent = response.status >= 400 && response.status < 500;
            await this.markScanAsFailed(scan.id, body.error, permanent);
            failedCount++;
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
          await this.markScanAsFailed(scan.id, 'Erreur réseau');
          failedCount++;
        }
      }

      if (successCount > 0) {
        await this.updateOnlineStatus(true);
      }

      return { success: successCount, failed: failedCount };
    } finally {
      this.syncing = false;
    }
  }

  // Vérifier la connectivité
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/tickets/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Mettre à jour le statut de connectivité
  async updateOnlineStatus(isOnline: boolean): Promise<void> {
    const offlineData = await this.getOfflineData();
    offlineData.isOnline = isOnline;
    offlineData.lastSync = isOnline ? Date.now() : offlineData.lastSync;
    await this.saveOfflineData(offlineData);
  }

  // Obtenir les statistiques hors ligne
  async getOfflineStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    lastSync: number;
    isOnline: boolean;
  }> {
    const offlineData = await this.getOfflineData();
    const stats = {
      pending: offlineData.scans.filter(s => s.status === 'pending').length,
      synced: offlineData.scans.filter(s => s.status === 'synced').length,
      failed: offlineData.scans.filter(s => s.status === 'failed').length,
      lastSync: offlineData.lastSync,
      isOnline: offlineData.isOnline
    };
    
    return stats;
  }

  // Méthodes privées
  private async getOfflineData(): Promise<OfflineData> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture des données hors ligne:', error);
    }
    
    return {
      scans: [],
      lastSync: 0,
      isOnline: true
    };
  }

  private async saveOfflineData(data: OfflineData): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données hors ligne:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const offlineStorage = new OfflineStorage(); 