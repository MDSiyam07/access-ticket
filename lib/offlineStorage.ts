export interface OfflineScan {
  id: string;
  ticketId: string;
  type: 'entry' | 'exit';
  timestamp: number;
  userId: string;
  userRole: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  lastRetry?: number;
}

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

  // Marquer un scan comme échoué
  async markScanAsFailed(scanId: string): Promise<void> {
    const offlineData = await this.getOfflineData();
    const scanIndex = offlineData.scans.findIndex(scan => scan.id === scanId);
    
    if (scanIndex !== -1) {
      const scan = offlineData.scans[scanIndex];
      scan.retryCount++;
      scan.lastRetry = Date.now();
      
      if (scan.retryCount >= this.MAX_RETRY_COUNT) {
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

  // Synchroniser les scans en attente
  async syncPendingScans(): Promise<{ success: number; failed: number }> {
    const pendingScans = await this.getPendingScans();
    let successCount = 0;
    let failedCount = 0;

    for (const scan of pendingScans) {
      try {
        const response = await fetch('/api/tickets/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId: scan.ticketId,
            type: scan.type,
            userId: scan.userId,
            userRole: scan.userRole,
            timestamp: scan.timestamp
          })
        });

        if (response.ok) {
          await this.markScanAsSynced(scan.id);
          successCount++;
        } else {
          await this.markScanAsFailed(scan.id);
          failedCount++;
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
        await this.markScanAsFailed(scan.id);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
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