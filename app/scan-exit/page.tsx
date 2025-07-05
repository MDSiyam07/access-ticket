'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import ControlledQRScanner from '@/components/ControlledQRScanner';
import LoadingSpinner from '@/components/LoadingSpinner';

type ScanResult = 'success' | 'not-inside' | 'invalid' | null;

export default function ScanExit() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scannerReady, setScannerReady] = useState(false);
  
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

  const simulateExitScan = useCallback((ticketId: string): ScanResult => {
    console.log('Scanning exit for ticket:', ticketId);
    
    // Simulate different scenarios
    const random = Math.random();
    if (random < 0.8) {
      return 'success';
    } else if (random < 0.95) {
      return 'not-inside';
    } else {
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
  const handleScan = useCallback((ticketId: string) => {
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
    
    timeoutRef.current = setTimeout(() => {
      const result = simulateExitScan(ticketId);
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
      } else if (result === 'not-inside') {
        toast.error(`Personne non présente - Billet ${ticketId}`, {
          duration: 4000,
          icon: '⚠️',
          style: {
            background: '#f59e0b',
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
    }, 1000);
  }, [simulateExitScan, resetScanResult]);

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
            Scan de Sortie
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
          Scan de Sortie
        </h1>
        <p className="text-gray-600">
          Scannez les billets pour enregistrer les sorties
        </p>
      </div>

      {/* Camera/Scan Area */}
      <Card className="festival-card">
        <CardContent className="p-0">
          <div 
            ref={scanAreaRef}
            className="relative aspect-square bg-gray-900 rounded-t-xl overflow-hidden"
          >
            {/* QR Code Scanner or Result Display */}
            {scanResult ? (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  {scanResult === 'success' ? (
                    <div className="text-center">
                      <CheckCircle className="w-24 h-24 text-orange-500 mx-auto mb-4" />
                      <p className="text-orange-400 text-2xl font-bold mb-2">
                        SORTIE VALIDÉE
                      </p>
                      <p className="text-white text-lg">
                        Billet: {scannedTicket}
                      </p>
                    </div>
                  ) : scanResult === 'not-inside' ? (
                    <div className="text-center">
                      <XCircle className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
                      <p className="text-yellow-400 text-2xl font-bold mb-2">
                        NON PRÉSENT
                      </p>
                      <p className="text-white text-lg">
                        Billet: {scannedTicket}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 text-2xl font-bold mb-2">
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
                    className="flex-1 h-12 festival-button"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {isScanning ? 'Scanner actif' : 'Démarrer le scan'}
                  </Button>
                  
                  {isScanning && (
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="h-12 px-6"
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
                    onClick={() => setShowManualInput(!showManualInput)}
                    variant="outline"
                    className="w-full h-12"
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
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualTicket('');
                    }}
                    variant="outline"
                    className="h-12"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleManualScan}
                    disabled={!manualTicket.trim()}
                    className="h-12 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Valider
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">423</div>
            <div className="text-sm text-gray-500">Sorties validées aujourd&apos;hui</div>
          </CardContent>
        </Card>
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">1424</div>
            <div className="text-sm text-gray-500">Personnes présentes</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}