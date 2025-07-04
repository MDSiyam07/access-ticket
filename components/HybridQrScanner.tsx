'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [backCameraId, setBackCameraId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Ajout pour gérer les AbortError
  const abortControllerRef = useRef<AbortController | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef(false);

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

  // Fonction de nettoyage améliorée
  const cleanupScanner = useCallback(async (force: boolean = false) => {
    if (isCleaningUpRef.current && !force) {
      console.log('Nettoyage déjà en cours...');
      return;
    }

    isCleaningUpRef.current = true;
    console.log('🧹 Début du nettoyage du scanner...');

    try {
      // Annuler toute opération en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Nettoyer le timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      // Arrêter le scanner HTML5
      if (html5QrCodeRef.current) {
        try {
          const scannerState = await html5QrCodeRef.current.getState();
          console.log('État du scanner avant nettoyage:', scannerState);
          
          if (scannerState === Html5QrcodeScannerState.SCANNING) {
            console.log('Arrêt du scanner en cours...');
            await html5QrCodeRef.current.stop();
          }
          
          html5QrCodeRef.current.clear();
          html5QrCodeRef.current = null;
          console.log('✅ Scanner nettoyé avec succès');
        } catch (cleanupError) {
          console.warn('⚠️ Erreur lors du nettoyage du scanner:', cleanupError);
        }
      }

      // Nettoyer l'élément DOM
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = '';
        console.log('✅ Élément DOM nettoyé');
      }

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  // Initialiser le scanner avec gestion d'AbortError améliorée
  const initializeScanner = useCallback(async () => {
    if (isInitializing || hasStarted || isCleaningUpRef.current) {
      console.log('Scanner déjà en cours d\'initialisation ou déjà démarré');
      return;
    }

    console.log('🚀 Démarrage du scanner HTML5-QRCode...');
    setIsInitializing(true);
    setError(null);

    // Créer un nouveau AbortController pour cette opération
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      // Vérifier si l'opération a été annulée
      if (signal.aborted) {
        throw new Error('Opération annulée avant le début');
      }

      // Nettoyer toute instance précédente
      await cleanupScanner(true);

      // Attendre un peu pour éviter les conflits
      await new Promise((resolve, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          if (signal.aborted) {
            reject(new Error('Opération annulée pendant l\'attente'));
          } else {
            resolve(void 0);
          }
        }, 300);
      });

      if (signal.aborted) {
        throw new Error('Opération annulée après l\'attente');
      }

      // Créer un ID unique pour éviter les conflits
      const uniqueId = `qr-reader-${Date.now()}`;
      
      // Préparer l'élément DOM
      const existingElement = document.getElementById("qr-reader");
      if (existingElement) {
        existingElement.innerHTML = '';
        existingElement.id = uniqueId;
      }

      if (signal.aborted) {
        throw new Error('Opération annulée pendant la préparation DOM');
      }

      // Créer l'instance HTML5-QRCode
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

      console.log('📷 Configuration caméra:', cameraConfig);
      console.log('⚙️ Configuration scanner:', config);

      if (signal.aborted) {
        throw new Error('Opération annulée avant le démarrage de la caméra');
      }

      // Démarrer le scanner avec un timeout
      const startPromise = html5QrCodeRef.current.start(
        cameraConfig,
        config,
        (decodedText: string) => {
          console.log('✅ QR Code détecté :', decodedText);
          toast.success(`QR détecté : ${decodedText}`, { duration: 3000 });
          onScanSuccess(decodedText);
          stopScanner();
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (errorMessage: string) => {
          // Erreurs mineures ignorées (ne pas logger pour éviter le spam)
          // console.warn('Scan error:', errorMessage);
        }
      );

      // Timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          if (!signal.aborted) {
            reject(new Error('Timeout lors de l\'initialisation du scanner'));
          }
        }, 10000); // 10 secondes
      });

      await Promise.race([startPromise, timeoutPromise]);

      if (signal.aborted) {
        throw new Error('Opération annulée après le démarrage');
      }

      setIsInitialized(true);
      setIsInitializing(false);
      setHasStarted(true);
      onStartScan();

      console.log('✅ Scanner initialisé avec succès');

    } catch (error: unknown) {
      console.error('❌ Erreur lors de l\'initialisation du scanner:', error);
      setIsInitializing(false);
      
      let errorMessage = 'Erreur lors de l\'initialisation du scanner';
      
      if (error instanceof Error) {
        console.log('📝 Type d\'erreur détecté:', error.name);
        console.log('📝 Message d\'erreur:', error.message);
        console.log('📝 Stack trace:', error.stack);

        if (error.name === 'AbortError' || error.message.includes('annulée')) {
          errorMessage = 'Opération annulée. Veuillez réessayer.';
          console.warn('⚠️ AbortError détecté - opération annulée');
          
          // Ne pas afficher d'erreur à l'utilisateur pour les AbortError
          // car c'est souvent intentionnel
          setError(null);
          return;
        } else if (error.name === 'NotAllowedError') {
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
        } else if (error.message?.includes('Timeout')) {
          errorMessage = 'Timeout lors de l\'initialisation. Vérifiez votre caméra.';
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
      
      // Nettoyer après une erreur
      await cleanupScanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, hasStarted, isMobile, backCameraId, onScanSuccess, onStartScan, onScanError, cleanupScanner]);

  // Arrêter le scanner
  const stopScanner = useCallback(async () => {
    console.log('🛑 Arrêt du scanner demandé...');
    
    // Annuler l'AbortController
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    await cleanupScanner();

    setIsInitialized(false);
    setIsInitializing(false);
    setError(null);
    setHasStarted(false);
    onStopScan();

    console.log('✅ Scanner arrêté');
  }, [cleanupScanner, onStopScan]);

  // Gérer changement état scan avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isScanning && !isInitializing && !hasStarted && !isCleaningUpRef.current) {
        console.log('🔄 Déclenchement de l\'initialisation du scanner (avec debounce)');
        initializeScanner();
      } else if ((!isScanning || error) && hasStarted) {
        console.log('🔄 Arrêt du scanner (avec debounce)');
        stopScanner();
      }
    }, 100); // Debounce de 100ms

    return () => clearTimeout(timeoutId);
  }, [isScanning, isInitializing, hasStarted, error, initializeScanner, stopScanner]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      console.log('🧹 Nettoyage au démontage du composant');
      cleanupScanner(true);
    };
  }, [cleanupScanner]);

  const handleStartScan = () => {
    console.log('🔘 Bouton démarrer cliqué, isScanning:', isScanning);
    if (!isScanning && !isInitializing && !isCleaningUpRef.current) {
      console.log('▶️ Démarrage du scan...');
      onStartScan();
    } else {
      console.log('⏸️ Scan déjà en cours ou en cours d\'initialisation');
    }
  };

  const handleStopScan = () => {
    if (isScanning) {
      console.log('⏹️ Arrêt du scan depuis le bouton');
      onStopScan();
    }
  };

  const handleRetry = async () => {
    console.log('🔄 Tentative de redémarrage...');
    setError(null);
    setHasStarted(false);
    
    if (isScanning) {
      await stopScanner();
      // Attendre un peu avant de redémarrer
      setTimeout(() => {
        console.log('🔄 Redémarrage après retry...');
        onStartScan();
      }, 1000);
    } else {
      onStartScan();
    }
  };

  const handleTestScan = () => {
    if (hasStarted) {
      const testQRCode = 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      console.log('🧪 Test QR Code:', testQRCode);
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
            disabled={isCleaningUpRef.current}
          >
            <Camera className="w-6 h-6 mr-3" />
            {isCleaningUpRef.current ? 'Nettoyage...' : 'Démarrer le scanner'}
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
                    disabled={isCleaningUpRef.current}
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