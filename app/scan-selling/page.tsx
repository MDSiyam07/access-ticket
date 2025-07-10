'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ZxingQRScanner from '../../components/ZxingQRScanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Camera, CheckCircle, XCircle, Type, Square } from 'lucide-react';
// import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function ScanSellingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTicket, setScannedTicket] = useState('');
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleScan = useCallback(async (ticketId: string) => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    setScannedTicket(ticketId);
    setIsScanning(false);
    processingRef.current = true;

    try {
      const response = await fetch('/api/tickets/scan-selling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketId,
          userId: user.id,
        }),
      });

      if (response.ok) {
        setScanResult('success');
      } else {
        setScanResult('error');
      }
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      setScanResult('error');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
      
      // Reset après 3 secondes
      setTimeout(() => {
        setScannedTicket('');
        setScanResult(null);
      }, 3000);
    }
  }, [user, isProcessing]);

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
    if (!showManualInput) {
      setIsScanning(false);
    }
  }, [showManualInput]);

  const cancelManualInput = useCallback(() => {
    setShowManualInput(false);
    setManualTicket('');
  }, []);

  const handleQRScanSuccess = useCallback((decodedText: string) => {
    console.log('QR Code scanné:', decodedText);
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
  if (!isClient || isLoading || authLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Scanner Vente de Tickets
          </h1>
          <LoadingSpinner size="lg" text="Initialisation..." />
        </div>
      </div>
    );
  }

  // Vérification des permissions
  if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'vendeur'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès Refusé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être vendeur ou administrateur pour accéder à cette page.
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Scanner Vente de Tickets
        </h1>
        <p className="text-muted-foreground text-lg">
          Scannez les QR codes pour marquer les tickets comme vendus
        </p>
      </div>

      {/* Camera/Scan Area */}
      <Card className="glass-card !py-0">
        <CardContent className="p-0">
          <div 
            ref={scanAreaRef}
            className="relative aspect-square bg-gradient-to-br from-orange-900 to-red-900 rounded-t-3xl overflow-hidden"
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
              <div className="absolute inset-0 bg-gradient-to-br from-orange-800/90 to-red-800/90 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  {scanResult === 'success' ? (
                    <div className="text-center">
                      <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4 pulse-glow" />
                      <p className="text-green-300 text-2xl font-bold mb-2">
                        TICKET VENDU
                      </p>
                      <p className="text-white text-lg">
                        Billet: {scannedTicket}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                      <p className="text-red-300 text-2xl font-bold mb-2">
                        ERREUR DE VENTE
                      </p>
                      <p className="text-white text-lg">
                        Billet: {scannedTicket}
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
                        ? "bg-orange-600 cursor-default"
                        : "bg-orange-500 hover:bg-orange-600 hover:shadow-xl active:scale-95",
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
                    <span className="text-orange-600 font-medium">🔍 Scanner actif - Pointez vers un QR code</span>
                  ) : (
                    <span className="text-muted-foreground">📱 Scanner prêt</span>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-muted-foreground mb-2">ou</p>
                  <Button
                    onClick={toggleManualInput}
                    variant="outline"
                    className="w-full h-12 rounded-2xl border-orange-200 text-orange-700 hover:bg-orange-50"
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
                    className="h-12 border-orange-200 text-orange-700 hover:bg-orange-50"
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
    </div>
  );
} 