'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type, Square } from 'lucide-react';
import toast from 'react-hot-toast';
// import SimpleCameraTest from '@/components/SimpleCameraTest';
import LoadingSpinner from '@/components/LoadingSpinner';
// import QrScanner from '@/components/QrScanner';
// import HybridQrScanner from '@/components/HybridQrScanner';
// import SimpleQRScanner from '@/components/SimpleQRScanner';
import ControlledQRScanner from '@/components/ControlledQRScanner';
import QuickStats from '@/components/QuickStats';
import { cn } from '@/lib/utils';

type ScanResult = 'success' | 'already-used' | 'invalid' | null;

export default function ScanEntry() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scannerReady, setScannerReady] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
  const startCamera = useCallback(() => {
    console.log('📷 Démarrage du scanner...');
    if (!processingRef.current && !scanResult && scannerReady) {
      setIsScanning(true);
      setShowManualInput(false); // Fermer la saisie manuelle
    } else {
      console.log('⚠️ Scanner non disponible');
      if (!scannerReady) {
        toast.error('Scanner non prêt, veuillez patienter');
      }
    }
  }, [scanResult, scannerReady]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Arrêt du scanner...');
    setIsScanning(false);
  }, []);

  // Callback quand le scanner est prêt
  const handleScannerReady = useCallback(() => {
    console.log('✅ Scanner prêt');
    setScannerReady(true);
  }, []);

  // Callback pour les erreurs de scanner
  const handleScannerError = useCallback((error: string) => {
    console.error('❌ Erreur scanner:', error);
    setScannerReady(false);
    toast.error('Erreur du scanner: ' + error);
  }, []);

  // Don't render until we're on the client side
  if (!isClient || isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scan d&apos;Entrée
          </h1>
          <LoadingSpinner size="lg" text="Initialisation..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Scan d&apos;Entrée
        </h1>
        <p className="text-gray-600">
          Scannez les billets pour valider l&apos;accès à l&apos;événement
        </p>
      </div>

      {/* Camera/Scan Area */}
      <Card className="festival-card !py-0">
        <CardContent className="p-0">
          <div 
            ref={scanAreaRef}
            className="relative aspect-square bg-gray-900 rounded-t-xl overflow-hidden"
          >
            {/* Scanner QR - Toujours rendu mais masqué quand il y a un résultat */}
            <div className={`absolute inset-0 ${scanResult ? 'invisible' : 'visible'}`}>
              <ControlledQRScanner
                onScanSuccess={handleQRScanSuccess}
                onScanError={handleQRScanError}
                isActive={isScanning && !scanResult}
                onScannerReady={handleScannerReady}
                onScannerError={handleScannerError}
              />
            </div>

            {/* Result Display - Affiché par-dessus le scanner */}
            {scanResult && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center z-10">
                <div className="text-center">
                  {scanResult === 'success' ? (
                    <div className="text-center">
                      <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
                      <p className="text-green-400 text-2xl font-bold mb-2">
                        ACCÈS AUTORISÉ
                      </p>
                      <p className="text-white text-lg">
                        Billet: {scannedTicket}
                      </p>
                    </div>
                  ) : scanResult === 'already-used' ? (
                    <div className="text-center">
                      <XCircle className="w-24 h-24 text-orange-500 mx-auto mb-4" />
                      <p className="text-orange-400 text-2xl font-bold mb-2">
                        BILLET DÉJÀ UTILISÉ
                      </p>
                      <p className="text-white text-lg">
                        Billet: {scannedTicket}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 text-2xl font-bold mb-2">
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

            {/* Placeholder pendant l'initialisation */}
            {!scannerReady && !scanResult && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Initialisation du scanner...</p>
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
                    disabled={!scannerReady || processingRef.current || isScanning}
                    className={cn(
                      "flex-1 h-14 rounded-2xl text-white text-lg font-semibold shadow-md transition-all duration-200",
                      isScanning
                        ? "bg-green-600 cursor-default"
                        : "bg-green-500 hover:bg-green-600 active:scale-[0.98]",
                      (!scannerReady || processingRef.current || isScanning) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {isScanning ? 'Scanner actif' : 'Démarrer le scan'}
                  </Button>
                  
                  {isScanning && (
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="h-14 px-6 rounded-2xl text-sm"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                {/* Indicateur d'état */}
                <div className="text-center text-sm">
                  {!scannerReady ? (
                    <span className="text-orange-500">⚠️ Scanner en préparation...</span>
                  ) : isScanning ? (
                    <span className="text-green-500">🔍 Scanner actif - Pointez vers un QR code</span>
                  ) : (
                    <span className="text-gray-500">📱 Scanner prêt</span>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-gray-500 mb-2">ou</p>
                  <Button
                    onClick={toggleManualInput}
                    variant="outline"
                    className="w-full h-12 rounded-2xl"
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
              <div className="space-y-3 pt-4 border-t border-gray-200">
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
                    className="h-12"
                    disabled={processingRef.current}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleManualScan}
                    disabled={!manualTicket.trim() || processingRef.current}
                    className="h-12 festival-button"
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
  );
}