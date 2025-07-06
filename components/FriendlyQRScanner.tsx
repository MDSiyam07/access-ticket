'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FriendlyQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean;
  onScannerReady?: () => void;
  onScannerError?: (error: string) => void;
}

const FriendlyQRScanner: React.FC<FriendlyQRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive,
  onScannerReady,
  onScannerError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannerState, setScannerState] = useState<'idle' | 'initializing' | 'ready' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isMounted = useRef(true);
  const isInitializing = useRef(false);
  const scannerId = 'friendly-qr-scanner';

  // Vérifier les permissions et compatibilité
  const checkCameraAccess = useCallback(async () => {
    try {
      // Test simple de l'accès caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      // Libérer immédiatement
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      return false;
    }
  }, []);

  // Attendre que l'élément DOM soit disponible
  const waitForElement = useCallback((id: string): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50;
      let attempts = 0;
      
      const check = () => {
        const el = document.getElementById(id);
        if (el) {
          resolve(el);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 100);
        } else {
          reject(new Error(`Element ${id} not found`));
        }
      };
      
      check();
    });
  }, []);

  // Callbacks optimisés
  const handleScanSuccess = useCallback((decodedText: string) => {
    onScanSuccess(decodedText);
  }, [onScanSuccess]);

  const handleScanError = useCallback((error: string) => {
    // Ignorer les erreurs normales de scan
    if (error.includes('NotFoundException') || 
        error.includes('No QR code found') ||
        error.includes('QR code parse error')) {
      return;
    }
    
    if (onScanError) {
      onScanError(error);
    }
  }, [onScanError]);

  // Initialiser le scanner
  const initializeScanner = useCallback(async () => {
    if (isInitializing.current || scannerRef.current || !isMounted.current) {
      return;
    }
    
    try {
      isInitializing.current = true;
      setScannerState('initializing');
      setErrorMessage(null);
      
      // Vérifier l'accès caméra
      const hasCamera = await checkCameraAccess();
      if (!hasCamera) {
        throw new Error('Accès à la caméra refusé ou indisponible');
      }
      
      if (!isMounted.current) return;
      
      // Attendre l'élément DOM
      await waitForElement(scannerId);
      
      if (!isMounted.current) return;
      
      // Configuration simple et fiable
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: []
      };

      scannerRef.current = new Html5QrcodeScanner(scannerId, config, false);
      
      if (!isMounted.current) return;
      
      setScannerState('ready');
      setRetryCount(0);
      
      if (onScannerReady) {
        onScannerReady();
      }
      
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur d\'initialisation';
      setErrorMessage(errorMsg);
      setScannerState('error');
      if (onScannerError) {
        onScannerError(errorMsg);
      }
    } finally {
      isInitializing.current = false;
    }
  }, [checkCameraAccess, waitForElement, onScannerReady, onScannerError]);

  // Démarrer le scan
  const startScanning = useCallback(async () => {
    if (!scannerRef.current || scannerState !== 'ready' || !isMounted.current) {
      return;
    }
    
    try {
      setScannerState('scanning');
      await scannerRef.current.render(handleScanSuccess, handleScanError);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de démarrage';
      setErrorMessage(errorMsg);
      setScannerState('error');
    }
  }, [handleScanSuccess, handleScanError, scannerState]);

  // Arrêter le scan
  const stopScanning = useCallback(async () => {
    if (!scannerRef.current || !isMounted.current) return;
    
    try {
      await scannerRef.current.clear();
      setScannerState('ready');
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }, []);

  // Nettoyer
  const cleanup = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
        setScannerState('idle');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }, []);

  // Redémarrer
  const restartScanner = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    await cleanup();
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (isMounted.current) {
      await initializeScanner();
    }
  }, [cleanup, initializeScanner]);

  // Montage/démontage
  useEffect(() => {
    isMounted.current = true;
    
    // Délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      if (isMounted.current) {
        initializeScanner();
      }
    }, 100);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeScanner, cleanup]);

  // Contrôle du scanner
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (scannerState === 'ready' && isActive) {
      startScanning();
    } else if (scannerState === 'scanning' && !isActive) {
      stopScanning();
    }
  }, [isActive, scannerState, startScanning, stopScanning]);

  // États de l'interface
  if (scannerState === 'idle' || scannerState === 'initializing') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-2 border-4 border-blue-200 rounded-full animate-ping"></div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Préparation du scanner
          </h3>
          <p className="text-gray-600 mb-4">
            Initialisation de la caméra en cours...
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        
        <div id={scannerId} className="hidden" />
      </div>
    );
  }

  if (scannerState === 'error') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-100 rounded-xl flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Oups ! Un problème est survenu
          </h3>
          
          <p className="text-gray-600 text-sm mb-6">
            {errorMessage?.includes('refusé') || errorMessage?.includes('denied') 
              ? "L'accès à la caméra est requis pour scanner les QR codes. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
              : "Impossible d'accéder à la caméra. Vérifiez que votre appareil dispose d'une caméra et que le navigateur est à jour."
            }
          </p>
          
          <Button
            onClick={restartScanner}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer {retryCount > 0 && `(${retryCount})`}
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            Astuce : Rechargez la page si le problème persiste
          </p>
        </div>
        
        <div id={scannerId} className="hidden" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black rounded-xl overflow-hidden">
      {/* Zone de scan */}
      <div id={scannerId} className="w-full h-full" />
      
      {/* Overlay quand le scanner est prêt mais pas actif */}
      {scannerState === 'ready' && !isActive && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Camera className="w-10 h-10" />
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Scanner prêt</h3>
            <p className="text-gray-300 mb-6">
              Appuyez sur &quot;Démarrer le scan&quot; pour activer la caméra
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-green-400">
              <Zap className="w-4 h-4" />
              <span>Caméra initialisée</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions de scan */}
      {scannerState === 'scanning' && (
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-4 text-center">
            <p className="text-white text-sm font-medium">
              📱 Pointez la caméra vers le QR code
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Le scan se fera automatiquement
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendlyQRScanner;
