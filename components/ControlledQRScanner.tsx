'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ControlledQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean; // Contrôle externe
  onScannerReady?: () => void; // Callback quand le scanner est prêt
  onScannerError?: (error: string) => void; // Callback pour les erreurs de setup
}

const ControlledQRScanner: React.FC<ControlledQRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive,
  onScannerReady,
  onScannerError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannerState, setScannerState] = useState<'idle' | 'initializing' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const isInitializing = useRef(false);
  const scannerId = 'controlled-qr-scanner';

  // Vérifier les permissions caméra
  const checkCameraPermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }

      // Test rapide d'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Libérer immédiatement
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      setPermissionGranted(false);
      const errorMsg = error instanceof Error ? error.message : "Permission d'accès à la caméra refusée.";
      setErrorMessage(errorMsg);
      if (onScannerError) onScannerError(errorMsg);
      return false;
    }
  }, [onScannerError]);

  // Callbacks stables
  const handleScanSuccess = useCallback((decodedText: string) => {
    console.log('✅ QR Code détecté:', decodedText);
    onScanSuccess(decodedText);
  }, [onScanSuccess]);

  const handleScanError = useCallback((error: string) => {
    // Filtrer les erreurs de scan normales (pas de QR trouvé)
    if (error.includes('NotFoundException') || 
        error.includes('No QR code found') ||
        error.includes('QR code parse error')) {
      return;
    }
    
    console.warn('⚠️ Erreur de scan:', error);
    if (onScanError) {
      onScanError(error);
    }
  }, [onScanError]);

  // Initialiser le scanner (mais ne pas le démarrer)
  const initializeScanner = useCallback(async () => {
    if (isInitializing.current || scannerRef.current) return;
    
    try {
      isInitializing.current = true;
      setScannerState('initializing');
      
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setScannerState('error');
        return;
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      scannerRef.current = new Html5QrcodeScanner(scannerId, config, false);
      setScannerState('ready');
      setErrorMessage(null);
      
      if (onScannerReady) onScannerReady();
      
    } catch (error) {
      console.error('❌ Erreur initialisation scanner:', error);
      setScannerState('error');
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'initialisation du scanner.";
      setErrorMessage(errorMsg);
      if (onScannerError) onScannerError(errorMsg);
    } finally {
      isInitializing.current = false;
    }
  }, [checkCameraPermission, onScannerReady, onScannerError]);

  // Démarrer le scan
  const startScanning = useCallback(async () => {
    if (!scannerRef.current || scannerState !== 'ready') return;
    
    try {
      await scannerRef.current.render(handleScanSuccess, handleScanError);
      console.log('📱 Scanner démarré');
    } catch (error) {
      console.error('❌ Erreur démarrage scan:', error);
      setScannerState('error');
    }
  }, [handleScanSuccess, handleScanError, scannerState]);

  // Arrêter le scan
  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) return;
    
    try {
      await scannerRef.current.clear();
      console.log('🛑 Scanner arrêté');
    } catch (error) {
      console.warn('⚠️ Erreur arrêt scanner:', error);
    }
  }, []);

  // Nettoyer complètement le scanner
  const cleanup = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
        setScannerState('idle');
        console.log('🧹 Scanner nettoyé');
      } catch (error) {
        console.warn('⚠️ Erreur nettoyage:', error);
      }
    }
  }, []);

  // Effect pour initialiser le scanner au montage
  useEffect(() => {
    initializeScanner();
    
    return () => {
      cleanup();
    };
  }, [initializeScanner, cleanup]);

  // Effect pour contrôler le scanner selon isActive
  useEffect(() => {
    if (scannerState !== 'ready') return;
    
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [isActive, scannerState, startScanning, stopScanning]);

  // Rendu conditionnel selon l'état
  if (scannerState === 'idle' || scannerState === 'initializing') {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">
            {scannerState === 'idle' ? 'Initialisation...' : 'Préparation de la caméra...'}
          </p>
        </div>
      </div>
    );
  }

  if (scannerState === 'error') {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-red-200">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold mb-1">Erreur de caméra</p>
          <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
          <button
            onClick={initializeScanner}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id={scannerId} className="w-full" />
      
      {!isActive && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <div className="mb-2">
              <svg className="w-12 h-12 mx-auto opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm">Scanner en pause</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlledQRScanner;