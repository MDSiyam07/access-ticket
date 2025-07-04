'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface SimpleCameraTestProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  className?: string;
}

export default function SimpleCameraTest({
  onScanSuccess,
  onScanError,
  isScanning,
  onStartScan,
  onStopScan,
  className = ""
}: SimpleCameraTestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    if (isInitializing || hasStarted) return;
    
    console.log('Démarrage de la caméra...');
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

      console.log('Demande d\'accès à la caméra...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          console.log('Caméra activée avec succès');
        } catch (playError) {
          console.error('Erreur lors du démarrage de la vidéo:', playError);
          toast.error('Erreur lors du démarrage de la caméra (lecture vidéo)');
          setError('Impossible de démarrer la caméra.');
          if (onScanError) onScanError('Impossible de lire la caméra');
          setIsInitializing(false);
          return;
        }
    }      

      setIsInitializing(false);
      setHasStarted(true);
      onStartScan();

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
  }, [isInitializing, hasStarted, onStartScan, onScanError]);

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    console.log('Arrêt de la caméra...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setError(null);
    setIsInitializing(false);
    setHasStarted(false);
    onStopScan();
  }, [onStopScan]);

  // Gérer le changement d'état de scan
  useEffect(() => {
    if (isScanning && !isInitializing && !hasStarted) {
      startCamera();
    } else if (!isScanning && hasStarted) {
      stopCamera();
    }
  }, [isScanning, isInitializing, hasStarted, startCamera, stopCamera]);

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
    setHasStarted(false);
    if (isScanning) {
      stopCamera();
      setTimeout(() => {
        onStartScan();
      }, 500);
    }
  };

  const handleTestScan = () => {
    if (hasStarted) {
      const testQRCode = 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      console.log('Test QR Code:', testQRCode);
      onScanSuccess(testQRCode);
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
            Cliquez pour démarrer la caméra
          </p>
          <Button
            onClick={handleStartScan}
            className="w-full h-14 text-lg festival-button"
          >
            <Camera className="w-6 h-6 mr-3" />
            Démarrer la caméra
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
            {!isInitializing && !error && hasStarted && (
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
              : hasStarted 
                ? 'Caméra active - Cliquez "Test Scan" pour simuler'
                : 'Prêt à démarrer'
            }
          </p>

          {!isInitializing && !error && hasStarted && (
            <div className="space-y-2 mt-4">
              <Button
                onClick={handleTestScan}
                className="w-full"
              >
                Test Scan (Simulation)
              </Button>
              <Button
                onClick={handleStopScan}
                variant="outline"
                className="w-full"
              >
                Arrêter la caméra
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 