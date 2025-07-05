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
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const scannerId = 'controlled-qr-scanner';

  // Fonction de debug
  const addDebugInfo = useCallback((message: string) => {
    console.log('🔍 QR Scanner:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // Vérifier la compatibilité du navigateur
  const checkBrowserCompatibility = useCallback(() => {
    const issues = [];
    
    if (!navigator.mediaDevices) {
      issues.push('navigator.mediaDevices non disponible');
    }
    
    if (!navigator.mediaDevices?.getUserMedia) {
      issues.push('getUserMedia non supporté');
    }
    
    if (!window.HTMLVideoElement) {
      issues.push('HTMLVideoElement non supporté');
    }
    
    // Vérifier si on est en HTTPS ou localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('HTTPS requis pour la caméra');
    }
    
    return issues;
  }, []);

  // Vérifier les permissions caméra avec retry
  const checkCameraPermission = useCallback(async (retryCount = 0) => {
    try {
      addDebugInfo('Vérification des permissions caméra...');
      
      // Vérifier la compatibilité d'abord
      const compatibilityIssues = checkBrowserCompatibility();
      if (compatibilityIssues.length > 0) {
        throw new Error(`Incompatibilité navigateur: ${compatibilityIssues.join(', ')}`);
      }

      // Tenter d'accéder à la caméra
      const constraints = {
        video: {
          facingMode: 'environment', // Caméra arrière préférée
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Vérifier que le stream est valide
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
      addDebugInfo(`Erreur permission (tentative ${retryCount + 1}): ${errorMessage}`);
      
      // Retry une fois avec des contraintes plus souples
      if (retryCount === 0) {
        try {
          const simpleConstraints = { video: true };
          const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
          stream.getTracks().forEach(track => track.stop());
          addDebugInfo('Caméra accessible avec contraintes simples');
          return true;
        } catch (retryError) {
          const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Erreur inconnue';
          addDebugInfo(`Retry échoué: ${retryErrorMessage}`);
        }
      }
      
      throw error;
    }
  }, [addDebugInfo, checkBrowserCompatibility]);

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
      return; // Ces erreurs sont normales quand il n'y a pas de QR code
    }
    
    addDebugInfo(`Erreur de scan: ${error}`);
    if (onScanError) {
      onScanError(error);
    }
  }, [onScanError, addDebugInfo]);

  // Initialiser le scanner
  const initializeScanner = useCallback(async () => {
    if (isInitializing.current || scannerRef.current || !isMounted.current) {
      addDebugInfo('Initialisation ignorée (déjà en cours ou composant démonté)');
      return;
    }
    
    try {
      isInitializing.current = true;
      setScannerState('initializing');
      addDebugInfo('Début initialisation scanner');
      
      // Vérifier les permissions
      await checkCameraPermission();
      
      if (!isMounted.current) return;
      
      // Configuration du scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false, // Désactiver le zoom pour éviter les conflits
        defaultZoomValueIfSupported: 1,
        supportedScanTypes: [], // Laisser vide pour tous les types
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      addDebugInfo('Création de l\'instance Html5QrcodeScanner');
      
      // Attendre que le DOM soit prêt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted.current) return;
      
      // Vérifier que l'élément DOM existe
      const element = document.getElementById(scannerId);
      if (!element) {
        throw new Error(`Élément DOM ${scannerId} introuvable`);
      }
      
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
  }, [checkCameraPermission, onScannerReady, onScannerError, addDebugInfo]);

  // Démarrer le scan
  const startScanning = useCallback(async () => {
    if (!scannerRef.current || scannerState !== 'ready' || !isMounted.current) {
      addDebugInfo('Démarrage ignoré - scanner non prêt');
      return;
    }
    
    try {
      addDebugInfo('Démarrage du scan');
      setScannerState('scanning');
      
      // Attendre un peu pour éviter les conflits
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
    await new Promise(resolve => setTimeout(resolve, 500));
    if (isMounted.current) {
      await initializeScanner();
    }
  }, [cleanup, initializeScanner, addDebugInfo]);

  // Effect pour l'initialisation
  useEffect(() => {
    isMounted.current = true;
    
    // Délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      if (isMounted.current) {
        initializeScanner();
      }
    }, 200);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeScanner, cleanup]);

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
          
          {/* Infos de debug */}
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
      
      {/* Debug info en bas */}
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