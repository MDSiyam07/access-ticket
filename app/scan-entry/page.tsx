/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type } from 'lucide-react';
import toast from 'react-hot-toast';
// import SimpleCameraTest from '@/components/SimpleCameraTest';
import LoadingSpinner from '@/components/LoadingSpinner';
// import QrScanner from '@/components/QrScanner';
import HybridQrScanner from '@/components/HybridQrScanner';

type ScanResult = 'success' | 'already-used' | 'invalid' | null;

export default function ScanEntry() {
  // États principaux
  const [isScanning, setIsScanning] = useState(false); // Commencer par false
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false); // Pour éviter les doubles traitements

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Simuler un délai de chargement pour mobile
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

  // Fonction de simulation stable (pas de dépendances)
  const simulateTicketScan = useCallback((ticketId: string): ScanResult => {
    console.log('Scanning ticket:', ticketId);
    
    // Simulate different scenarios
    const random = Math.random();
    if (random < 0.7) {
      return 'success';
    } else if (random < 0.9) {
      return 'already-used';
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

  // Fonction principale de traitement - STABLE
  const handleScan = useCallback((ticketId: string) => {
    console.log('🎫 Traitement du billet:', ticketId);
    
    // Éviter les traitements multiples
    if (processingRef.current) {
      console.log('⚠️ Traitement déjà en cours, ignoré');
      return;
    }
    
    processingRef.current = true;
    setScannedTicket(ticketId);
    
    // Arrêter le scanner immédiatement
    setIsScanning(false);
    
    // Nettoyer les timeouts précédents
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Simuler le traitement
    timeoutRef.current = setTimeout(() => {
      const result = simulateTicketScan(ticketId);
      setScanResult(result);

      // Show toast notifications
      if (result === 'success') {
        toast.success(`Billet ${ticketId} validé avec succès`);
      } else if (result === 'already-used') {
        toast.error(`Le billet ${ticketId} a déjà été scanné`);
      } else {
        toast.error(`Le billet ${ticketId} n'est pas valide`);
      }

      // Reset après 3 secondes
      timeoutRef.current = setTimeout(() => {
        resetScanResult();
      }, 3000);
    }, 1000);
  }, [simulateTicketScan, resetScanResult]); // Dépendances stables uniquement

  // Handlers pour l'input manuel - STABLES
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
  }, [showManualInput]);

  const cancelManualInput = useCallback(() => {
    setShowManualInput(false);
    setManualTicket('');
  }, []);

  // Handlers pour le scanner QR - SIMPLIFIÉS
  const handleQRScanSuccess = useCallback((decodedText: string) => {
    console.log('📱 QR Code scanné:', decodedText);
    handleScan(decodedText);
  }, [handleScan]);

  const handleQRScanError = useCallback((error: string) => {
    console.error('❌ QR Scan error:', error);
    toast.error('Erreur lors du scan du QR code');
  }, []);

  // Handlers pour contrôler le scanner - SIMPLIFIÉS
  const startCamera = useCallback(() => {
    console.log('📷 Démarrage du scanner...');
    if (!processingRef.current && !scanResult) {
      setIsScanning(true);
    } else {
      console.log('⚠️ Scanner bloqué - traitement en cours ou résultat affiché');
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
      <Card className="festival-card">
        <CardContent className="p-0">
          <div 
            ref={scanAreaRef}
            className="relative aspect-square bg-gray-900 rounded-t-xl overflow-hidden"
          >
            {/* QR Code Scanner or Result Display */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {scanResult ? (
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
              ) : (
                <HybridQrScanner
                  onScanSuccess={handleQRScanSuccess}
                  onScanError={handleQRScanError}
                  isScanning={isScanning}
                  onStartScan={startCamera}
                  onStopScan={stopCamera}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 space-y-4">
            {!scanResult && (
              <>
                <div className="text-center">
                  <p className="text-gray-500 mb-2">ou</p>
                  <Button
                    onClick={toggleManualInput}
                    variant="outline"
                    className="w-full h-12"
                    disabled={processingRef.current}
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
      <div className="grid grid-cols-2 gap-4">
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">847</div>
            <div className="text-sm text-gray-500">Entrées validées aujourd&apos;hui</div>
          </CardContent>
        </Card>
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">1653</div>
            <div className="text-sm text-gray-500">Billets restants</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}