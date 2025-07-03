'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface MobileQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  className?: string;
}

export default function MobileQRScanner({
  onScanSuccess,
  onScanError,
  isScanning,
  onStartScan,
  onStopScan,
  className = ""
}: MobileQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Détecter le type d'appareil
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent.toLowerCase());
    setIsMobile(isMobileDevice);
    setIsIOS(isIOSDevice);
  }, []);

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      // Demander l'accès à la caméra
      const constraints = {
        video: {
          facingMode: 'environment', // Caméra arrière
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsInitializing(false);
      onStartScan();

      // Simuler une détection de QR code après 3 secondes pour test
      setTimeout(() => {
        if (isScanning) {
          const testQRCode = 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
          console.log('QR Code de test détecté:', testQRCode);
          onScanSuccess(testQRCode);
          stopCamera();
        }
      }, 3000);

    } catch (err) {
      console.error('Erreur d\'accès à la caméra:', err);
      setIsInitializing(false);
      
      let errorMessage = 'Erreur lors de l\'accès à la caméra';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres.';
          toast.error('Accès à la caméra refusé');
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Aucune caméra trouvée sur cet appareil.';
          toast.error('Aucune caméra trouvée');
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Votre navigateur ne supporte pas l\'accès à la caméra.';
          toast.error('Navigateur non supporté');
        } else {
          errorMessage = `Erreur: ${err.message}`;
          toast.error(`Erreur: ${err.message}`);
        }
      }
      
      setError(errorMessage);
      if (onScanError) {
        onScanError(errorMessage);
      }
    }
  }, [isInitializing, isScanning, onStartScan, onScanError]);

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setError(null);
    setIsInitializing(false);
    onStopScan();
  }, [onStopScan]);

  // Gérer le changement d'état de scan
  useEffect(() => {
    if (isScanning && !isInitializing && !streamRef.current) {
      startCamera();
    } else if (!isScanning) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScanning, isInitializing, startCamera, stopCamera]);

  // Nettoyage
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleStartScan = () => {
    if (!isScanning) {
      onStartScan();
    }
  };

  const handleStopScan = () => {
    if (isScanning) {
      onStopScan();
    }
  };

  const handleRetry = () => {
    setError(null);
    if (isScanning) {
      stopCamera();
      setTimeout(() => {
        onStartScan();
      }, 500);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {!isScanning ? (
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-gray-300 border-opacity-30 rounded-lg mb-4 mx-auto flex items-center justify-center">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">
            Cliquez pour démarrer le scanner QR code
          </p>
          {isMobile && (
            <p className="text-sm text-gray-500 mb-4">
              {isIOS 
                ? 'Sur iOS, autorisez l\'accès à la caméra quand demandé'
                : 'Autorisez l\'accès à la caméra quand demandé'
              }
            </p>
          )}
          <Button
            onClick={handleStartScan}
            className="w-full h-14 text-lg festival-button"
          >
            <Camera className="w-6 h-6 mr-3" />
            Démarrer le scanner
          </Button>
        </div>
      ) : (
        <div className="relative">
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <LoadingSpinner size="lg" text="Initialisation de la caméra..." />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center text-white p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                {isMobile && (
                  <div className="text-sm text-gray-400 mb-4">
                    <p>Conseils pour mobile :</p>
                    <ul className="text-left mt-2">
                      <li>• Vérifiez les permissions caméra</li>
                      <li>• Utilisez Safari sur iOS</li>
                      <li>• Rechargez la page si nécessaire</li>
                      <li>• Vérifiez que vous êtes en HTTPS</li>
                    </ul>
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    onClick={handleRetry}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                  <Button
                    onClick={handleStopScan}
                    variant="outline"
                    className="w-full"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="relative aspect-square bg-gray-900 rounded-t-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {/* Zone de scan */}
            {!isInitializing && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-opacity-50 rounded-lg relative w-48 h-48">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-2 text-center">
            {isInitializing 
              ? 'Initialisation...' 
              : 'Positionnez le QR code dans la zone de scan (test: 3s)'
            }
          </p>

          {!isInitializing && !error && (
            <Button
              onClick={handleStopScan}
              variant="outline"
              className="w-full mt-4"
            >
              Arrêter le scanner
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 