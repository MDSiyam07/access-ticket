'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type, Square, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ZxingQRScanner from '@/components/ZxingQRScanner';
import QuickStats from '@/components/QuickStats';
import EntryRoute from '@/components/EntryRoute';
import { cn } from '@/lib/utils';
import { offlineStorage } from '@/lib/offlineStorage';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

type ScanResult = 'success' | 'invalid' | 'not-exited' | 'already-entered' | 'error' | null;

export default function ScanReentry() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ticketHistory, setTicketHistory] = useState<Array<{
    action: string;
    scannedAt: string;
  }> | null>(null);
  
  // Refs
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Vérification d'authentification
  useEffect(() => {
    console.log('[ScanReentry] Auth check - user:', user, 'authLoading:', authLoading);
    if (!authLoading && !user) {
      console.log('[ScanReentry] No user, redirecting to login');
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  // Ensure we're on the client side
  useEffect(() => {
    console.log("Standalone mode:", window.matchMedia('(display-mode: standalone)').matches);

    setIsClient(true);
    
    // Réduire le délai de chargement pour Android
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(timer);
    };
  }, []);

  // Vérification de sécurité pour éviter les boucles infinies
  useEffect(() => {
    if (isClient && !isLoading) {
      const authCheck = setTimeout(() => {
        if (isLoading) {
          console.warn('Loading state stuck - forcing reset');
          setIsLoading(false);
        }
      }, 3000);

      return () => clearTimeout(authCheck);
    }
  }, [isClient, isLoading]);

  // Fonction de scan réelle avec l'API
  const scanTicketReentry = useCallback(async (ticketId: string): Promise<ScanResult> => {
    console.log('Scanning reentry for ticket:', ticketId);
    
    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketId,
          action: 'REENTER',
          entryType: 'SCAN',
          userId: user?.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        
        if (error.message?.includes('n\'a jamais été sorti')) {
          return 'not-exited';
        } else if (error.message?.includes('déjà entré')) {
          return 'already-entered';
        } else if (error.message?.includes('non trouvé')) {
          return 'invalid';
        } else {
          return 'error';
        }
      }

      const result = await response.json();
      console.log('API Success:', result);
      
      // Récupérer l'historique du ticket pour l'affichage
      if (result.ticketHistory) {
        setTicketHistory(result.ticketHistory);
      }
      
      return 'success';
    } catch (error) {
      console.error('Network Error:', error);
      // Sauvegarde hors ligne
      if (user) {
        await offlineStorage.saveOfflineScan({
          ticketId,
          type: 'entry',
          timestamp: Date.now(),
          userId: user.id,
          userRole: user.role
        });
      }
      return 'success';
    }
  }, [user]);

  // Reset stable
  const resetScanResult = useCallback(() => {
    console.log('🔄 Reset scan result');
    setScanResult(null);
    setScannedTicket('');
    setTicketHistory(null);
    processingRef.current = false;
  }, []);

  // Fonction principale de traitement
  const handleScan = useCallback(async (ticketId: string) => {
    console.log('🎫 Traitement du billet:', ticketId);
    
    if (processingRef.current) {
      console.log('⚠️ Traitement déjà en cours, ignoré');
      return;
    }
    
    processingRef.current = true;
    setScannedTicket(ticketId);
    
    // Arrêter le scanner immédiatement
    setIsScanning(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      const result = await scanTicketReentry(ticketId);
      setScanResult(result);

      // Trigger stats refresh on success
      if (result === 'success') {
        setRefreshTrigger(prev => prev + 1);
      }

      // Reset après 3 secondes
      timeoutRef.current = setTimeout(() => {
        resetScanResult();
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      resetScanResult();
    }
  }, [scanTicketReentry, resetScanResult]);

  // Handlers pour l'input manuel
  const handleManualScan = useCallback(() => {
    if (manualTicket.trim()) {
      handleScan(manualTicket.trim());
      setManualTicket('');
      setShowManualInput(false);
    }
  }, [manualTicket, handleScan]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  }, [handleManualScan]);

  const toggleManualInput = useCallback(() => {
    setShowManualInput(!showManualInput);
    if (showManualInput) {
      setManualTicket('');
    }
    // Arrêter le scanner si on ouvre la saisie manuelle
    if (!showManualInput) {
      setIsScanning(false);
    }
  }, [showManualInput]);

  const cancelManualInput = useCallback(() => {
    setShowManualInput(false);
    setManualTicket('');
  }, []);

  // Handlers pour le scanner QR
  const handleQRScanSuccess = useCallback((decodedText: string) => {
    console.log('📱 QR Code scanné:', decodedText);
    handleScan(decodedText);
  }, [handleScan]);

  // Handlers pour contrôler le scanner
  const startCamera = useCallback(() => {
    console.log('📷 Démarrage du scanner...');
    if (!processingRef.current && !scanResult) {
      setIsScanning(true);
      setShowManualInput(false);
    } else {
      console.log('⚠️ Scanner non disponible');
    }
  }, [scanResult]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Arrêt du scanner...');
    setIsScanning(false);
  }, []);

  // Don't render until we're on the client side
  if (!isClient || isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Scanner Ré-entrée
          </h1>
          <LoadingSpinner size="lg" text="Initialisation..." />
        </div>
      </div>
    );
  }

  // Vérification des permissions
  if (!authLoading && (!user || (user.role !== 'reentry' && user.role !== 'admin'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès Refusé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être contrôleur de ré-entrée ou administrateur pour accéder à cette page.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <EntryRoute>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Scanner Ré-entrée
          </h1>
          <p className="text-muted-foreground text-lg">
            Scannez les billets pour valider la ré-entrée à l&apos;événement
          </p>
        </div>

        {/* Camera/Scan Area */}
        <Card className="glass-card !py-0">
          <CardContent className="p-0">
            <div 
              ref={scanAreaRef}
              className="relative aspect-square bg-gradient-to-br from-blue-900 to-cyan-900 rounded-t-3xl overflow-hidden"
            >
              {/* Scanner QR - Toujours rendu, contrôlé par isActive */}
              <div className="absolute inset-0">
                <ZxingQRScanner
                  onScan={handleQRScanSuccess}
                  isActive={isScanning && !scanResult}
                />
              </div>

              {/* Result Display - Affiché par-dessus le scanner */}
              {scanResult && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800/90 to-cyan-800/90 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    {scanResult === 'success' ? (
                      <div className="text-center">
                        <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4 pulse-glow" />
                        <p className="text-green-300 text-2xl font-bold mb-2">
                          RÉ-ENTRÉE AUTORISÉE
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                      </div>
                    ) : scanResult === 'not-exited' ? (
                      <div className="text-center">
                        <AlertCircle className="w-24 h-24 text-orange-400 mx-auto mb-4" />
                        <p className="text-orange-300 text-2xl font-bold mb-2">
                          TICKET NON AUTORISÉ
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                        <p className="text-white text-sm mt-2">
                          N&apos;a jamais été sorti
                        </p>
                      </div>
                    ) : scanResult === 'already-entered' ? (
                      <div className="text-center">
                        <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 text-2xl font-bold mb-2">
                          BILLET DÉJÀ ENTRÉ
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 text-2xl font-bold mb-2">
                          ACCÈS REFUSÉ
                        </p>
                        <p className="text-white text-lg">
                          Billet invalide: {scannedTicket}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 space-y-4">
              {!scanResult && (
                <>
                  {/* Boutons de contrôle du scanner */}
                  <div className="flex gap-3">
                    <Button
                      onClick={startCamera}
                      disabled={processingRef.current || isScanning}
                      className={cn(
                        "flex-1 h-14 rounded-2xl text-white text-lg font-semibold shadow-lg transition-all duration-300",
                        isScanning
                          ? "bg-cyan-600 cursor-default"
                          : "bg-cyan-500 hover:bg-cyan-600 hover:shadow-xl active:scale-95",
                        (processingRef.current || isScanning) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {isScanning ? 'Scanner actif' : 'Démarrer le scan'}
                    </Button>
                    
                    {isScanning && (
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        className="h-14 px-6 rounded-2xl text-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Square className="w-5 h-5 text-blue-600" />
                      </Button>
                    )}
                  </div>

                  {/* Indicateur d'état */}
                  <div className="text-center text-sm">
                    {isScanning ? (
                      <span className="text-cyan-600 font-medium">🔍 Scanner actif - Pointez vers un QR code</span>
                    ) : (
                      <span className="text-muted-foreground">📱 Scanner prêt</span>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">ou</p>
                    <Button
                      onClick={toggleManualInput}
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-blue-200 text-blue-700 hover:bg-blue-50"
                      disabled={processingRef.current || isScanning}
                    >
                      <Type className="w-5 h-5 mr-2" />
                      Saisie manuelle
                    </Button>
                  </div>
                </>
              )}

              {/* Manual input */}
              {showManualInput && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Input
                    placeholder="Numéro de billet (ex: TK1234)"
                    value={manualTicket}
                    onChange={(e) => setManualTicket(e.target.value)}
                    className="h-12 text-base text-center font-mono"
                    onKeyDown={handleKeyPress}
                    autoFocus
                    disabled={processingRef.current}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={cancelManualInput}
                      variant="outline"
                      className="h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                      disabled={processingRef.current}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleManualScan}
                      disabled={!manualTicket.trim() || processingRef.current}
                      className="h-12 glass-button"
                    >
                      {processingRef.current ? 'Traitement...' : 'Valider'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <QuickStats type="entry" refreshTrigger={refreshTrigger} />
      </div>
    </EntryRoute>
  );
} 