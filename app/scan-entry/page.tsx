'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
// import ControlledQRScanner from '@/components/ControlledQRScanner';
import QuickStats from '@/components/QuickStats';
import EntryRoute from '@/components/EntryRoute';
import { cn } from '@/lib/utils';
import SpecialPWAScannerTest from '@/components/SpecialPWAScannerTest';

type ScanResult = 'success' | 'already-used' | 'invalid' | null;

export default function ScanEntry() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Refs
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);

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
  const scanTicket = useCallback(async (ticketId: string): Promise<ScanResult> => {
    console.log('Scanning ticket:', ticketId);
    
    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketId,
          action: 'ENTER',
          entryType: 'SCAN'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        
        if (error.message?.includes('déjà entré')) {
          return 'already-used';
        } else if (error.message?.includes('non trouvé')) {
          return 'invalid';
        } else {
          return 'invalid';
        }
      }

      const result = await response.json();
      console.log('API Success:', result);
      return 'success';
    } catch (error) {
      console.error('Network Error:', error);
      return 'invalid';
    }
  }, []);

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
      const result = await scanTicket(ticketId);
      setScanResult(result);

      // Show toast notifications
      if (result === 'success') {
        toast.success(`Billet ${ticketId} validé avec succès`);
        // Trigger stats refresh
        setRefreshTrigger(prev => prev + 1);
      } else if (result === 'already-used') {
        toast.error(`Le billet ${ticketId} a déjà été scanné`);
      } else {
        toast.error(`Le billet ${ticketId} n'est pas valide`);
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
  }, [scanTicket, resetScanResult]);

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

  const handleQRScanError = useCallback((error: string) => {
    console.error('❌ QR Scan error:', error);
    toast.error('Erreur lors du scan du QR code');
  }, []);

  // Handlers pour contrôler le scanner
  const startCamera = useCallback(async () => {
    console.log('📷 Démarrage du scanner...');
    if (processingRef.current || scanResult) {
      console.log('⚠️ Scanner non disponible');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
  
      setStream(stream);
      setIsScanning(true);
      setShowManualInput(false);
    } catch (err) {
      console.error('Erreur d’accès à la caméra', err);
      toast.error("Impossible d'accéder à la caméra.");
    }
  }, [scanResult]);
  

  const stopCamera = useCallback(() => {
    console.log('🛑 Arrêt du scanner...');
    setIsScanning(false);
  }, []);

  // Handlers for ControlledQRScanner
  const handleScannerReady = useCallback(() => {
    console.log('📷 Scanner prêt');
  }, []);

  const handleScannerError = useCallback((error: string) => {
    console.error('❌ Scanner error:', error);
    toast.error('Erreur lors de la préparation du scanner');
  }, []);

  // Don't render until we're on the client side
  if (!isClient || isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Scan d&apos;Entrée
          </h1>
          <LoadingSpinner size="lg" text="Initialisation..." />
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
            Scan d&apos;Entrée
          </h1>
          <p className="text-muted-foreground text-lg">
            Scannez les billets pour valider l&apos;accès à l&apos;événement
          </p>
        </div>

        {/* Camera/Scan Area */}
        <Card className="glass-card !py-0">
          <CardContent className="p-0">
            <div 
              ref={scanAreaRef}
              className="relative aspect-square bg-gradient-to-br from-modern-violet-900 to-modern-cyan-900 rounded-t-3xl overflow-hidden"
            >
              {/* Scanner QR - Toujours rendu mais masqué quand il y a un résultat */}
              {isScanning && !scanResult && (
                <div className="absolute inset-0">
                  {/* <ControlledQRScanner
                     stream={stream}
                    onScanSuccess={handleQRScanSuccess}
                    onScanError={handleQRScanError}
                    isActive
                    onScannerReady={handleScannerReady}
                    onScannerError={handleScannerError}
                  /> */}
                  <SpecialPWAScannerTest
                    stream={stream}
                    onScanSuccess={handleQRScanSuccess}
                    onScanError={handleQRScanError}
                    isActive
                    onScannerReady={handleScannerReady}
                    onScannerError={handleScannerError}
                  />
                </div>
              )}

              {/* Result Display - Affiché par-dessus le scanner */}
              {scanResult && (
                <div className="absolute inset-0 bg-gradient-to-br from-modern-violet-800/90 to-modern-cyan-800/90 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    {scanResult === 'success' ? (
                      <div className="text-center">
                        <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4 pulse-glow" />
                        <p className="text-green-300 text-2xl font-bold mb-2">
                          ACCÈS AUTORISÉ
                        </p>
                        <p className="text-white text-lg">
                          Billet: {scannedTicket}
                        </p>
                      </div>
                    ) : scanResult === 'already-used' ? (
                      <div className="text-center">
                        <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 text-2xl font-bold mb-2">
                          BILLET DÉJÀ UTILISÉ
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
                        className="h-14 px-6 rounded-2xl text-sm border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Square className="w-5 h-5 text-red-500" />
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
                      onClick={toggleManualInput}
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
                      onClick={cancelManualInput}
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
        <QuickStats type="entry" refreshTrigger={refreshTrigger} />
      </div>
    </EntryRoute>
  );
}