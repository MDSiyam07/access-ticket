'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X, AlertCircle, Smartphone, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface IOSQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  title?: string;
  className?: string;
}

export default function IOSQRScanner({
  onScanSuccess,
  onScanError,
  onClose,
  isScanning,
  onStartScan,
  onStopScan,
  title = "Scanner QR Code iOS",
  className = ""
}: IOSQRScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  useEffect(() => {
    if (isScanning && !isInitialized && !isInitializing) {
      console.log('IOSQRScanner - Starting initialization...');
      initializeScanner();
    }

    return () => {
      console.log('IOSQRScanner - Cleanup');
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
      console.log('IOSQRScanner - Creating Html5Qrcode...');
      
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      // Configuration spécifique pour iOS
      const config = {
        fps: 1, // FPS très bas pour iOS
        qrbox: { width: 150, height: 150 }, // Zone plus petite
        aspectRatio: 1.0,
        disableFlip: true, // Désactiver le flip sur iOS
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        }
      };

      console.log('IOSQRScanner - Config:', config);

      // Essayer différentes configurations de caméra pour iOS
      const cameraConfigs = [
        { facingMode: "environment" },
        { facingMode: "user" },
        { deviceId: "default" }
      ];

      let success = false;
      
      for (const cameraConfig of cameraConfigs) {
        try {
          console.log('IOSQRScanner - Trying camera config:', cameraConfig);
          
          await html5QrCodeRef.current.start(
            cameraConfig,
            config,
            (decodedText: string) => {
              console.log('IOSQRScanner - QR Code scanned:', decodedText);
              onScanSuccess(decodedText);
              stopScanner();
            },
            (errorMessage: string) => {
              console.log('IOSQRScanner - Scan error (non-critical):', errorMessage);
            }
          );
          
          success = true;
          break;
        } catch (cameraError) {
          console.log('IOSQRScanner - Camera config failed:', cameraConfig, cameraError);
          continue;
        }
      }

      if (!success) {
        throw new Error('Aucune caméra compatible trouvée');
      }

      console.log('IOSQRScanner - Started successfully');
      setIsInitialized(true);
      setIsInitializing(false);
      
    } catch (error) {
      console.error('IOSQRScanner - Error initializing:', error);
      setIsInitializing(false);
      
      let errorMessage = 'Erreur lors de l\'initialisation du scanner';
      
      if (error instanceof Error) {
        if (error.message.includes('Camera streaming not supported')) {
          errorMessage = 'Safari iOS ne supporte pas le streaming caméra. Utilisez l\'option "Sélectionner une image".';
          setShowFileUpload(true);
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Accès à la caméra refusé. Installez l\'app pour de meilleures permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucune caméra trouvée. Utilisez l\'option "Sélectionner une image".';
          setShowFileUpload(true);
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      
      if (onScanError) {
        onScanError(errorMessage);
      }
    }
  };

  const stopScanner = async () => {
    console.log('IOSQRScanner - Stopping scanner...');
    
    if (html5QrCodeRef.current && isInitialized) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('IOSQRScanner - Error stopping scanner:', error);
      }
    }
    
    setIsInitialized(false);
    setIsInitializing(false);
    setError(null);
    setShowFileUpload(false);
    onStopScan();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !html5QrCodeRef.current) return;

    console.log('IOSQRScanner - Processing uploaded file:', file.name);

    html5QrCodeRef.current.clear();
    html5QrCodeRef.current = new Html5Qrcode("qr-reader");

    html5QrCodeRef.current
      .scanFile(file, true)
      .then((decodedText) => {
        console.log('IOSQRScanner - QR Code from file:', decodedText);
        onScanSuccess(decodedText);
        stopScanner();
      })
      .catch((error) => {
        console.error('IOSQRScanner - File scan error:', error);
        toast.error('Impossible de lire le QR code dans cette image');
        setError('Impossible de lire le QR code dans cette image');
      });
  };

  const handleStartScan = () => {
    console.log('IOSQRScanner - Start scan button clicked');
    onStartScan();
  };

  const handleStopScan = () => {
    console.log('IOSQRScanner - Stop scan button clicked');
    stopScanner();
  };

  return (
    <div className={`relative ${className}`}>
      {!isScanning ? (
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-gray-300 border-opacity-30 rounded-lg mb-4 mx-auto flex items-center justify-center">
            <Smartphone className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">
            Scanner QR code optimisé pour iOS
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Si la caméra ne fonctionne pas, vous pourrez sélectionner une image
          </p>
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
                  <p className="text-sm text-gray-400 mt-2">
                    iOS: Test des configurations caméra
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white p-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 mb-4">{error}</p>
                  
                  {showFileUpload && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-3">
                        Alternative : Sélectionnez une image contenant un QR code
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="text-white border-white hover:bg-white hover:text-gray-900"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Sélectionner une image
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400 mb-4">
                    <p>Conseils pour iOS :</p>
                    <ul className="text-left mt-2">
                      <li>• Utilisez Safari (pas Chrome/Firefox)</li>
                      <li>• Installez l'app sur l'écran d'accueil</li>
                      <li>• Autorisez l'accès caméra</li>
                      <li>• Essayez l'option "Sélectionner une image"</li>
                    </ul>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setError(null);
                      setIsInitialized(false);
                      setShowFileUpload(false);
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
                <div className="w-48 h-48 border-4 border-white border-opacity-50 rounded-lg relative">
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
              ? 'Initialisation... (iOS)' 
              : 'Positionnez le QR code dans la zone de scan'
            }
          </p>
        </div>
      )}
    </div>
  );
} 