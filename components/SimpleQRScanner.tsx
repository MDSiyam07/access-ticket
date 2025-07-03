'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X, AlertCircle, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface SimpleQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  title?: string;
  className?: string;
}

export default function SimpleQRScanner({
  onScanSuccess,
  onScanError,
  onClose,
  isScanning,
  onStartScan,
  onStopScan,
  title = "Scanner QR Code",
  className = ""
}: SimpleQRScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detect device type
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent.toLowerCase());
    
    setIsMobile(isMobileDevice);
    setIsIOS(isIOSDevice);
    
    console.log('SimpleQRScanner - Device detection:', { isMobile: isMobileDevice, isIOS: isIOSDevice });
  }, []);

  useEffect(() => {
    if (isScanning && !isInitialized && !isInitializing) {
      console.log('SimpleQRScanner - Starting initialization...');
      initializeScanner();
    }

    return () => {
      console.log('SimpleQRScanner - Cleanup');
      stopScanner();
    };
  }, [isScanning, isInitialized, isInitializing]);

  const initializeScanner = async () => {
    if (!containerRef.current) {
      console.error('Container ref not available');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      console.log('SimpleQRScanner - Creating Html5Qrcode...');
      
      // Vérifier si l'app est installée comme PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      
      console.log('SimpleQRScanner - PWA Standalone mode:', isStandalone);
      
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      // Configuration pour mobile avec support PWA
      const config = {
        fps: isMobile ? 5 : 10,
        qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        }
      };

      console.log('SimpleQRScanner - Config:', config);

      // Essayer d'abord avec la caméra arrière, puis la caméra avant si échec
      let cameraConfig = { facingMode: "environment" };
      
      try {
        // Démarrer le scan avec la caméra arrière
        await html5QrCodeRef.current.start(
          cameraConfig,
          config,
          (decodedText: string) => {
            console.log('SimpleQRScanner - QR Code scanned:', decodedText);
            onScanSuccess(decodedText);
            stopScanner();
          },
          (errorMessage: string) => {
            console.log('SimpleQRScanner - Scan error (non-critical):', errorMessage);
            // Ne pas afficher les erreurs de scan normales
          }
        );
      } catch {
        console.log('SimpleQRScanner - Back camera failed, trying front camera...');
        
        // Essayer avec la caméra avant
        cameraConfig = { facingMode: "user" };
        await html5QrCodeRef.current.start(
          cameraConfig,
          config,
          (decodedText: string) => {
            console.log('SimpleQRScanner - QR Code scanned:', decodedText);
            onScanSuccess(decodedText);
            stopScanner();
          },
          (errorMessage: string) => {
            console.log('SimpleQRScanner - Scan error (non-critical):', errorMessage);
          }
        );
      }

      console.log('SimpleQRScanner - Started successfully');
      setIsInitialized(true);
      setIsInitializing(false);
      
    } catch (error) {
      console.error('SimpleQRScanner - Error initializing:', error);
      setIsInitializing(false);
      
      let errorMessage = 'Erreur lors de l\'initialisation du scanner';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres.';
          toast.error('Accès à la caméra refusé. Installez l\'app pour de meilleures permissions.');
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucune caméra trouvée sur cet appareil.';
          toast.error('Aucune caméra trouvée sur cet appareil.');
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Votre navigateur ne supporte pas l\'accès à la caméra.';
          toast.error('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez Safari sur iOS.');
        } else {
          errorMessage = `Erreur: ${error.message}`;
          toast.error(`Erreur: ${error.message}`);
        }
      }
      
      setError(errorMessage);
      
      if (onScanError) {
        onScanError(errorMessage);
      }
    }
  };

  const stopScanner = async () => {
    console.log('SimpleQRScanner - Stopping scanner...');
    
    if (html5QrCodeRef.current && isInitialized) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('SimpleQRScanner - Error stopping scanner:', error);
      }
    }
    
    setIsInitialized(false);
    setIsInitializing(false);
    setError(null);
    onStopScan();
  };

  const handleStartScan = () => {
    console.log('SimpleQRScanner - Start scan button clicked');
    onStartScan();
  };

  const handleStopScan = () => {
    console.log('SimpleQRScanner - Stop scan button clicked');
    stopScanner();
  };

  return (
    <div className={`relative ${className}`}>
      {!isScanning ? (
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-gray-300 border-opacity-30 rounded-lg mb-4 mx-auto flex items-center justify-center">
            {isMobile ? (
              <Smartphone className="w-16 h-16 text-gray-400" />
            ) : (
              <Camera className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <p className="text-gray-600 mb-4">
            {isMobile 
              ? 'Scanner QR code optimisé pour mobile'
              : 'Scanner QR code simple'
            }
          </p>
          {isMobile && (
            <p className="text-sm text-gray-500 mb-4">
              {isIOS 
                ? 'iOS: Utilise la caméra arrière par défaut'
                : 'Mobile: Utilise la caméra arrière par défaut'
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleStopScan}
                variant="outline"
                size="sm"
              >
                Arrêter
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div 
            ref={containerRef}
            className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[400px]"
          >
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Initialisation de la caméra...</p>
                  {isMobile && (
                    <p className="text-sm text-gray-400 mt-2">
                      {isIOS ? 'iOS: Autorisez l\'accès si demandé' : 'Mobile: Autorisez l\'accès si demandé'}
                    </p>
                  )}
                </div>
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
                  <Button
                    onClick={() => {
                      setError(null);
                      setIsInitialized(false);
                      initializeScanner();
                    }}
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-gray-900"
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            )}
            
            <div id="qr-reader" className="w-full"></div>
            
            {/* Overlay with scan area - only show when scanner is ready */}
            {!isInitializing && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`border-4 border-white border-opacity-50 rounded-lg relative ${
                  isMobile ? 'w-48 h-48' : 'w-64 h-64'
                }`}>
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
              ? `Initialisation...${isMobile ? ' (Mobile)' : ''}` 
              : 'Positionnez le QR code dans la zone de scan'
            }
          </p>
        </div>
      )}
    </div>
  );
} 