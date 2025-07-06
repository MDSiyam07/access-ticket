'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ControlledQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean;
  onScannerReady?: () => void;
  onScannerError?: (error: string) => void;
}

const waitForElement = (id: string, timeout = 5000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsed = 0;
    
    const check = () => {
      const el = document.getElementById(id);
      if (el) {
        console.log(`✅ Élément ${id} trouvé après ${elapsed}ms`);
        return resolve(el);
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        console.error(`❌ Élément ${id} introuvable après ${timeout}ms`);
        return reject(new Error(`Élément DOM ${id} introuvable après ${timeout}ms`));
      }
      setTimeout(check, interval);
    };
    
    check();
  });
};

const ControlledQRScanner: React.FC<ControlledQRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive,
  onScannerReady,
  onScannerError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannerState, setScannerState] = useState<'idle' | 'initializing' | 'ready' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [domReady, setDomReady] = useState(false);
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const scannerId = 'controlled-qr-scanner';

  // Fonction de debug
  const addDebugInfo = useCallback((message: string) => {
    console.log('🔍 QR Scanner:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // Vérifier les permissions caméra de manière simplifiée (comme camera-test)
  const checkCameraPermission = useCallback(async () => {
    try {
      addDebugInfo('Vérification des permissions caméra...');
      
      // Contraintes simples et standard (comme camera-test)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream || stream.getTracks().length === 0) {
        throw new Error('Stream caméra invalide');
      }
      
      addDebugInfo(`Caméra accessible: ${stream.getTracks().length} tracks`);
      
      // Libérer immédiatement le stream
      stream.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(`Track ${track.kind} libéré`);
      });
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addDebugInfo(`Erreur permission: ${errorMessage}`);
      throw error;
    }
  }, [addDebugInfo]);

  // Callbacks stables pour le scanner
  const handleScanSuccess = useCallback((decodedText: string) => {
    addDebugInfo(`QR Code détecté: ${decodedText.substring(0, 20)}...`);
    onScanSuccess(decodedText);
  }, [onScanSuccess, addDebugInfo]);

  const handleScanError = useCallback((error: string) => {
    // Filtrer les erreurs normales de scan
    if (error.includes('NotFoundException') || 
        error.includes('No QR code found') ||
        error.includes('QR code parse error') ||
        error.includes('NotFoundError')) {
      return;
    }
    
    addDebugInfo(`Erreur de scan: ${error}`);
    if (onScanError) {
      onScanError(error);
    }
  }, [onScanError, addDebugInfo]);

  // Initialiser le scanner avec configuration iOS/PWA
  const initializeScanner = useCallback(async () => {
    if (isInitializing.current || scannerRef.current || !isMounted.current || !domReady) {
      addDebugInfo('Initialisation ignorée (déjà en cours, DOM non prêt ou composant démonté)');
      return;
    }
    
    try {
      isInitializing.current = true;
      setScannerState('initializing');
      addDebugInfo('Début initialisation scanner');
      
      // Attendre plus longtemps pour iOS
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Vérifier les permissions (sans interaction utilisateur pour l'instant)
      await checkCameraPermission();
      
      if (!isMounted.current) return;
      
      // Attendre que l'élément DOM soit disponible
      addDebugInfo(`Attente de l'élément DOM ${scannerId}...`);
      await waitForElement(scannerId, 10000); // Timeout plus long pour iOS
      
      if (!isMounted.current) return;
      
      // Configuration du scanner adaptée pour iOS
      const config = {
        fps: 6, // FPS très bas pour iOS
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 1,
        supportedScanTypes: [],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        },
        // Options spéciales pour iOS
        videoConstraints: {
          facingMode: 'environment',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      };

      addDebugInfo('Création de l\'instance Html5QrcodeScanner');
      scannerRef.current = new Html5QrcodeScanner(scannerId, config, false);
      
      if (!isMounted.current) return;
      
      addDebugInfo('Scanner initialisé avec succès');
      setScannerState('ready');
      setErrorMessage(null);
      
      if (onScannerReady) {
        onScannerReady();
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'initialisation';
      addDebugInfo(`Erreur initialisation: ${errorMessage}`);
      setScannerState('error');
      setErrorMessage(errorMessage);
      if (onScannerError) {
        onScannerError(errorMessage);
      }
    } finally {
      isInitializing.current = false;
    }
  }, [checkCameraPermission, onScannerReady, onScannerError, addDebugInfo, domReady]);

  // Démarrer le scan
  const startScanning = useCallback(async () => {
    if (!scannerRef.current || scannerState !== 'ready' || !isMounted.current) {
      addDebugInfo('Démarrage ignoré - scanner non prêt');
      return;
    }
    
    try {
      addDebugInfo('Démarrage du scan');
      setScannerState('scanning');
      
      // Attendre plus longtemps pour iOS
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isMounted.current) return;
      
      await scannerRef.current.render(handleScanSuccess, handleScanError);
      addDebugInfo('Scanner démarré avec succès');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addDebugInfo(`Erreur démarrage: ${errorMessage}`);
      setScannerState('error');
      setErrorMessage(errorMessage);
    }
  }, [handleScanSuccess, handleScanError, scannerState, addDebugInfo]);

  // Arrêter le scan
  const stopScanning = useCallback(async () => {
    if (!scannerRef.current || !isMounted.current) return;
    
    try {
      addDebugInfo('Arrêt du scanner');
      await scannerRef.current.clear();
      setScannerState('ready');
      addDebugInfo('Scanner arrêté');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addDebugInfo(`Erreur arrêt: ${errorMessage}`);
    }
  }, [addDebugInfo]);

  // Nettoyer le scanner
  const cleanup = useCallback(async () => {
    if (scannerRef.current) {
      try {
        addDebugInfo('Nettoyage du scanner');
        await scannerRef.current.clear();
        scannerRef.current = null;
        setScannerState('idle');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        addDebugInfo(`Erreur nettoyage: ${errorMessage}`);
      }
    }
  }, [addDebugInfo]);

  // Redémarrer le scanner
  const restartScanner = useCallback(async () => {
    addDebugInfo('Redémarrage du scanner');
    await cleanup();
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (isMounted.current) {
      await initializeScanner();
    }
  }, [cleanup, initializeScanner, addDebugInfo]);

  // Effect pour vérifier que le DOM est prêt
  useEffect(() => {
    isMounted.current = true;
    
    const checkDomReady = () => {
      const element = document.getElementById(scannerId);
      if (element) {
        addDebugInfo('DOM prêt, élément trouvé');
        setDomReady(true);
      } else {
        addDebugInfo('DOM non prêt, élément introuvable');
        setTimeout(checkDomReady, 100);
      }
    };
    
    const timer = setTimeout(checkDomReady, 300);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [addDebugInfo, cleanup]);

  // Effect pour l'initialisation une fois que le DOM est prêt
  useEffect(() => {
    if (domReady && isMounted.current) {
      addDebugInfo('DOM prêt, initialisation du scanner');
      initializeScanner();
    }
  }, [domReady, initializeScanner, addDebugInfo]);

  // Effect pour contrôler le scanner
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (scannerState === 'ready' && isActive) {
      startScanning();
    } else if (scannerState === 'scanning' && !isActive) {
      stopScanning();
    }
  }, [isActive, scannerState, startScanning, stopScanning]);

  // Rendu selon l'état
  if (scannerState === 'idle' || scannerState === 'initializing') {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 mb-2">
            {scannerState === 'idle' ? 'Initialisation...' : 'Préparation de la caméra...'}
          </p>
          {debugInfo.length > 0 && (
            <div className="text-xs text-gray-500 max-w-xs">
              {debugInfo.map((info, index) => (
                <div key={index} className="truncate">{info}</div>
              ))}
            </div>
          )}
        </div>
        <div id={scannerId} className="hidden" />
      </div>
    );
  }

  if (scannerState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-red-200 p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold mb-1">Erreur de scanner</p>
          <p className="text-red-500 text-sm mb-3 max-w-xs">{errorMessage}</p>
          
          {debugInfo.length > 0 && (
            <div className="text-xs text-gray-600 mb-3 max-w-xs">
              <details>
                <summary className="cursor-pointer text-gray-500">Détails techniques</summary>
                <div className="mt-2 text-left">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="break-all">{info}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
          
          <button
            onClick={restartScanner}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            Réessayer
          </button>
        </div>
        <div id={scannerId} className="hidden" />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div id={scannerId} className="w-full" />
      
      {scannerState === 'ready' && !isActive && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <div className="mb-2">
              <svg className="w-12 h-12 mx-auto opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm">Scanner prêt</p>
            <p className="text-xs opacity-75">Cliquez sur &quot;Démarrer&quot; pour activer</p>
          </div>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <details>
            <summary>Debug Info</summary>
            {debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </details>
        </div>
      )}
    </div>
  );
};

export default ControlledQRScanner;