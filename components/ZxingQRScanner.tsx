"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

type ScanResult = 'success' | 'already-used' | 'invalid' | null;

interface ZxingQRScannerProps {
  onScanSuccess?: (ticketId: string) => void;
  onScanError?: (error: string) => void;
  autoConnect?: boolean;
}

export default function ZxingQRScanner({ 
  onScanSuccess, 
  onScanError, 
  autoConnect = false 
}: ZxingQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scannedTicket, setScannedTicket] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingRef] = useState({ current: false });

  // Fonction de scan avec l'API
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
      toast.error('Erreur de connexion. Vérifiez votre connexion internet.');
      return 'invalid';
    }
  }, []);

  // Reset scan result
  const resetScanResult = useCallback(() => {
    console.log('🔄 Reset scan result');
    setScanResult(null);
    setScannedTicket('');
    processingRef.current = false;
    setIsProcessing(false);
  }, [processingRef]);

  // Fonction principale de traitement
  const handleScan = useCallback(async (ticketId: string) => {
    console.log('🎫 Traitement du billet:', ticketId);
    
    if (processingRef.current) {
      console.log('⚠️ Traitement déjà en cours, ignoré');
      return;
    }
    
    processingRef.current = true;
    setIsProcessing(true);
    setScannedTicket(ticketId);
    
    // Arrêter le scanner immédiatement
    setIsScanning(false);
    
    try {
      const result = await scanTicket(ticketId);
      setScanResult(result);

      // Show toast notifications
      if (result === 'success') {
        toast.success(`Billet ${ticketId} validé avec succès`);
        onScanSuccess?.(ticketId);
      } else if (result === 'already-used') {
        toast.error(`Le billet ${ticketId} a déjà été scanné`);
      } else {
        toast.error(`Le billet ${ticketId} n'est pas valide`);
      }

      // Reset après 3 secondes
      setTimeout(() => {
        resetScanResult();
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      toast.error('Erreur lors du traitement du billet');
      onScanError?.('Erreur lors du traitement du billet');
      resetScanResult();
    }
  }, [scanTicket, resetScanResult, onScanSuccess, onScanError]);

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    if (isScanning) return;
    
    try {
      setError(null);
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      
      // Démarrer la lecture des codes
      startDecoding();
      
    } catch (err) {
      console.error("Camera error:", err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setIsScanning(false);
      onScanError?.("Impossible d'accéder à la caméra");
    }
  }, [isScanning, onScanError]);

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Démarrer la lecture des codes
  const startDecoding = useCallback(() => {
    if (!videoRef.current) return;

    const decode = async () => {
      if (!isScanning || processingRef.current) return;

      try {
        await codeReader.current.decodeFromVideoElement(videoRef.current!, (result, error) => {
          if (result) {
            console.log('QR Code détecté:', result.getText());
            handleScan(result.getText());
          }
          if (error && error.name !== "NotFoundException") {
            console.error("Decoding error:", error);
          }
        });
      } catch (err: unknown) {
        console.error("Decoding setup error:", err);
      }
    };

    decode();
  }, [isScanning, handleScan, processingRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto-connect si demandé
  useEffect(() => {
    if (autoConnect && !isScanning && !error) {
      startCamera();
    }
  }, [autoConnect, isScanning, error, startCamera]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Scanner QR Code
          </h3>

          {!isScanning && !scanResult && (
            <Button
              onClick={startCamera}
              className="w-full"
              disabled={isProcessing}
            >
              <Camera className="w-4 h-4 mr-2" />
              Démarrer le scanner
            </Button>
          )}

          {isScanning && (
            <div className="relative w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg border-2 border-blue-500"
              />
              <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none">
                <div className="absolute inset-4 border-2 border-blue-500 rounded-lg"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <LoadingSpinner size="sm" />
              <span>Traitement en cours...</span>
            </div>
          )}

          {scanResult && (
            <div className={`w-full p-4 rounded-lg border-2 ${
              scanResult === 'success' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-red-500 bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center space-x-2">
                {scanResult === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {scanResult === 'success' && `Billet ${scannedTicket} validé`}
                  {scanResult === 'already-used' && `Billet ${scannedTicket} déjà utilisé`}
                  {scanResult === 'invalid' && `Billet ${scannedTicket} invalide`}
                </span>
              </div>
            </div>
          )}

          {isScanning && (
            <Button
              onClick={stopCamera}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Arrêter le scanner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 