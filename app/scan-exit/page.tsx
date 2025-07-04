'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import HybridQrScanner from '@/components/HybridQrScanner';

type ScanResult = 'success' | 'not-inside' | 'invalid' | null;

export default function ScanExit() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scanAreaRef = useRef<HTMLDivElement>(null);

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

  const handleScan = useCallback((ticketId: string) => {
    setIsScanning(true);
    setScannedTicket(ticketId);
    
    setTimeout(() => {
      const result = simulateExitScan(ticketId);
      setScanResult(result);
      setIsScanning(false);

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

      // Reset after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setScannedTicket('');
      }, 3000);
    }, 1000);
  }, [simulateExitScan]);

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

  const startCamera = useCallback(() => {
    setIsScanning(true);
  }, []);

  const stopCamera = useCallback(() => {
    setIsScanning(false);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  }, [handleManualScan]);

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
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {scanResult ? (
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
              ) : (
                <HybridQrScanner
                  onScanSuccess={handleQRScanSuccess}
                  onScanError={handleQRScanError}
                  isScanning={isScanning}
                  onStartScan={startCamera}
                  onStopScan={stopCamera}
                  // title="Scanner de Sortie"
                  className="w-full h-full"
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 space-y-4">
            {!isScanning && !scanResult && (
              <>
                <Button
                  onClick={startCamera}
                  className="w-full h-14 text-lg bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Scanner la sortie
                </Button>

                <div className="text-center">
                  <p className="text-gray-500 mb-2">ou</p>
                  <Button
                    onClick={() => setShowManualInput(!showManualInput)}
                    variant="outline"
                    className="w-full h-12"
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