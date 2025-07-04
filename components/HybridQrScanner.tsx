'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface HybridQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  className?: string;
}

export default function HybridQrScanner({
  onScanSuccess,
  onScanError,
  isScanning,
  onStartScan,
  onStopScan,
  className = ""
}: HybridQrScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [backCameraId, setBackCameraId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Detect device type
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent.toLowerCase());
    setIsMobile(isMobileDevice);
    setIsIOS(isIOSDevice);
  }, []);

  // Récupérer deviceId caméra arrière
  useEffect(() => {
    async function getBackCameraId() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const backCamera = videoDevices.find(d => /back|rear|environment/gi.test(d.label));
        setBackCameraId(backCamera ? backCamera.deviceId : (videoDevices[0]?.deviceId ?? null));
      } catch (err) {
        console.warn('Erreur lors de la récupération des caméras :', err);
        setBackCameraId(null);
      }
    }
    getBackCameraId();
  }, []);

  // Initialiser le scanner
  const initializeScanner = useCallback(async () => {
    if (isInitializing || hasStarted) return;

    console.log('Démarrage du scanner HTML5-QRCode...');
    setIsInitializing(true);
    setError(null);

    try {
      // Créer un ID unique pour éviter les conflits
      const uniqueId = `qr-reader-${Date.now()}`;
      
      // Vérifier si l'élément existe déjà
      const existingElement = document.getElementById("qr-reader");
      if (existingElement) {
        existingElement.innerHTML = '';
        existingElement.id = uniqueId;
      }

      html5QrCodeRef.current = new Html5Qrcode(uniqueId);
      
      const config = {
        fps: isMobile ? 5 : 10,
        qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        }
      };

      // Configuration caméra
      let cameraConfig: { deviceId?: { exact: string }; facingMode?: string };
      if (backCameraId) {
        cameraConfig = { deviceId: { exact: backCameraId } };
      } else {
        cameraConfig = { facingMode: "environment" };
      }

      console.log('Configuration caméra:', cameraConfig);
      console.log('Configuration scanner:', config);

      await html5QrCodeRef.current.start(
        cameraConfig,
        config,
        (decodedText: string) => {
          console.log('QR Code détecté :', decodedText);
          toast.success(`QR détecté : ${decodedText}`, { duration: 3000 });
          onScanSuccess(decodedText);
          stopScanner();
        },
        (errorMessage: string) => {
          // Erreurs mineures ignorées
          console.warn('Scan error:', errorMessage);
        }
      );

      setIsInitialized(true);
      setIsInitializing(false);
      setHasStarted(true);
      onStartScan();

    } catch (error: unknown) {
      console.error('Scanner initialization error:', error);
      setIsInitializing(false);
      let errorMessage = 'Erreur lors de l\'initialisation du scanner';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Accès à la caméra refusé. Autorisez la caméra dans les paramètres.';
          toast.error(errorMessage);
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucune caméra trouvée sur cet appareil.';
          toast.error(errorMessage);
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Navigateur ne supporte pas la caméra.';
          toast.error(errorMessage);
        } else if (error.message?.includes('Camera streaming not supported')) {
          errorMessage = 'Safari iOS ne supporte pas le streaming caméra.';
          toast.error(errorMessage);
        } else {
          errorMessage = `Erreur: ${error.message}`;
          toast.error(errorMessage);
        }
      } else {
        errorMessage = `Erreur: ${String(error)}`;
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
      if (onScanError) onScanError(errorMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, hasStarted, isMobile, backCameraId, onScanSuccess, onStartScan, onScanError]);

  // Arrêter le scanner
  const stopScanner = useCallback(async () => {
    console.log('Arrêt du scanner...');

    if (html5QrCodeRef.current && isInitialized) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Erreur arrêt scanner:', error);
      }
    }

    setIsInitialized(false);
    setIsInitializing(false);
    setError(null);
    setHasStarted(false);
    onStopScan();
  }, [isInitialized, onStopScan]);

  // Gérer changement état scan
  useEffect(() => {
    if (isScanning && !isInitializing && !hasStarted) {
      initializeScanner();
    } else if ((!isScanning || error) && hasStarted) {
      stopScanner();
    }
  }, [isScanning, isInitializing, hasStarted, error, initializeScanner, stopScanner]);

  // Nettoyage
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

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
      stopScanner();
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
            {isMobile ? <Smartphone className="w-16 h-16 text-gray-400" /> : <Camera className="w-16 h-16 text-gray-400" />}
          </div>
          <p className="text-gray-600 mb-4">
            {isMobile ? 'Scanner QR code optimisé pour mobile' : 'Scanner QR code hybride'}
          </p>
          {isMobile && (
            <p className="text-sm text-gray-500 mb-4">
              {isIOS ? 'iOS : Utilise la caméra arrière par défaut' : 'Mobile : Utilise la caméra arrière par défaut'}
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
              <LoadingSpinner size="lg" text="Initialisation du scanner..." />
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
            <div id="qr-reader" style={{ width: '100%', height: '100%', position: 'relative' }} />
          </div>

          <p className="text-sm text-gray-600 mt-2 text-center">
            {isInitializing
              ? 'Initialisation...'
              : hasStarted
                ? 'Scanner actif - Cliquez "Test Scan" pour simuler'
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
                Arrêter le scanner
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}