'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import ControlledQRScanner from '@/components/ControlledQRScanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import QuickStats from '@/components/QuickStats';
import ExitRoute from '@/components/ExitRoute';
import { cn } from '@/lib/utils';
import { offlineStorage } from '@/lib/offlineStorage';
import { useAuth } from '@/app/contexts/AuthContext';

type ScanResult = 'success' | 'not-inside' | 'invalid' | null;

export default function ScanExit() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Refs
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);

  const { user } = useAuth();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(timer);
    };
  }, []);

  // Fonction de scan réelle avec l'API
  const scanTicketExit = useCallback(async (ticketId: string): Promise<ScanResult> => {
    console.log('Scanning exit for ticket:', ticketId);
    
    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketId,
          action: 'EXIT',
          entryType: 'SCAN'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        
        if (error.message?.includes('pas encore été validé')) {
          return 'not-inside';
        } else if (error.message?.includes('non trouvé')) {
          return 'invalid';
        } else if (error.message?.includes('déjà sorti')) {
          return 'not-inside';
        } else {
          return 'invalid';
        }
      }

      const result = await response.json();
      console.log('API Success:', result);
      return 'success';
    } catch (error) {
      console.error('Network Error:', error);
      // Sauvegarde hors ligne
      if (user) {
        await offlineStorage.saveOfflineScan({
          ticketId,
          type: 'exit',
          timestamp: Date.now(),
          userId: user.id,
          userRole: user.role
        });
        toast('Scan sauvegardé hors ligne', { icon: '📶' });
      }
      return 'success'; // On considère comme succès localement
    }
  }, [user]);

  // Reset stable
  const resetScanResult = useCallback(() => {
    console.log('🔄 Reset scan result');
    setScanResult(null);
    setScannedTicket('');
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
      const result = await scanTicketExit(ticketId);
      setScanResult(result);

      // Show toast notifications
      if (result === 'success') {
        toast.success(`Sortie validée - Billet ${ticketId}`, {
          duration: 4000,
          icon: '✅',
          style: {
            background: '#10b981',
            color: 'white',
          },
        });
        // Trigger stats refresh
        setRefreshTrigger(prev => prev + 1);

      } else if (result === 'not-inside') {
        toast.error(`Personne non présente - Billet ${ticketId}`, {
          duration: 4000,
          icon: '⚠️',
          style: {
            background: '#6b7280',
            color: 'white',
          },
        });
      } else {
        toast.error(`Billet invalide - ${ticketId}`, {
          duration: 4000,
          icon: '❌',
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
      }

      // Reset après 3 secondes
      timeoutRef.current = setTimeout(() => {
        resetScanResult();
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      toast.error('Erreur lors du traitement du billet');
      resetScanResult();
    }
  }, [scanTicketExit, resetScanResult]);

  const handleQRScanSuccess = useCallback((decodedText: string) => {
    console.log('QR Code scanned for exit:', decodedText);
    handleScan(decodedText);
  }, [handleScan]);

  const handleQRScanError = useCallback((error: string) => {
    console.error('QR Scan error:', error);
    toast.error('Erreur lors du scan du QR code');
  }, []);

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

  // Handlers pour contrôler le scanner
  const startCamera = useCallback(() => {
    console.log('📷 Démarrage du scanner...');
    if (!processingRef.current && !scanResult) {
      setIsScanning(true);
      setShowManualInput(false); // Fermer la saisie manuelle
    } else {
      console.log('⚠️ Scanner non disponible');
    }
  }, [scanResult]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Arrêt du scanner...');
    setIsScanning(false);
  }, []);

  const handleScannerReady = useCallback(() => {
    console.log('Scanner ready');
  }, []);

  const handleScannerError = useCallback((error: string) => {
    console.error('Scanner error:', error);
    toast.error('Erreur lors de la préparation du scanner');
  }, []);

  // Don't render until we're on the client side
  if (!isClient || isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Scan de Sortie
          </h1>
          <LoadingSpinner size="lg" text="Initialisation..." />
        </div>
      </div>
    );
  }

  return (
    <ExitRoute>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Scan de Sortie
          </h1>
          <p className="text-muted-foreground text-lg">
            Scannez les billets pour enregistrer les sorties
          </p>
        </div>

        {/* Camera/Scan Area */}
        <Card className="glass-card !py-0">
          <CardContent className="p-0">
            <div 
              ref={scanAreaRef}
              className="relative aspect-square bg-gradient-to-br from-modern-violet-900 to-modern-cyan-900 rounded-t-3xl overflow-hidden"
            >
              {/* QR Code Scanner or Result Display */}
              {scanResult ? (
                <div className="absolute inset-0 bg-gradient-to-br from-modern-violet-800/90 to-modern-cyan-800/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    {scanResult === 'success' ? (
                      <div className="text-center">
                        <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4 pulse-glow" />
                        <p className="text-green-300 text-2xl font-bold mb-2">
                          SORTIE VALIDÉE
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                      </div>
                    ) : scanResult === 'not-inside' ? (
                      <div className="text-center">
                        <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 text-2xl font-bold mb-2">
                          NON PRÉSENT
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 text-2xl font-bold mb-2">
                          BILLET INVALIDE
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`absolute inset-0 ${scanResult ? 'invisible' : 'visible'}`}>
                  <ControlledQRScanner
                    onScanSuccess={handleQRScanSuccess}
                    onScanError={handleQRScanError}
                    isActive={isScanning && !scanResult}
                    onScannerReady={handleScannerReady}
                    onScannerError={handleScannerError}
                  />
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
                          ? "bg-modern-cyan-600 cursor-default"
                          : "bg-modern-cyan-500 hover:bg-modern-cyan-600 hover:shadow-xl active:scale-95",
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
                        className="h-14 px-6 rounded-2xl text-sm border-modern-violet-200 text-modern-violet-600 hover:bg-modern-violet-50"
                      >
                        <Square className="w-5 h-5 text-modern-violet-600" />
                      </Button>
                    )}
                  </div>

                  {/* Indicateur d'état */}
                  <div className="text-center text-sm">
                    {isScanning ? (
                      <span className="text-modern-cyan-600 font-medium">🔍 Scanner actif - Pointez vers un QR code</span>
                    ) : (
                      <span className="text-muted-foreground">📱 Scanner prêt</span>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">ou</p>
                    <Button
                      onClick={() => setShowManualInput(!showManualInput)}
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-modern-violet-200 text-modern-violet-700 hover:bg-modern-violet-50"
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
                      onClick={() => {
                        setShowManualInput(false);
                        setManualTicket('');
                      }}
                      variant="outline"
                      className="h-12 border-modern-violet-200 text-modern-violet-700 hover:bg-modern-violet-50"
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
        <QuickStats type="exit" refreshTrigger={refreshTrigger} />
      </div>
    </ExitRoute>
  );
}