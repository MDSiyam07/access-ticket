// 'use client';
// import { useEffect, useRef, useState, useCallback } from 'react';
// import { Html5QrcodeScanner } from 'html5-qrcode';

// interface ControlledQRScannerProps {
//   onScanSuccess: (decodedText: string) => void;
//   onScanError?: (errorMessage: string) => void;
//   isActive: boolean;
//   onScannerReady?: () => void;
//   onScannerError?: (error: string) => void;
// }

// const waitForElement = (id: string, timeout = 5000): Promise<HTMLElement> => {
//   return new Promise((resolve, reject) => {
//     const interval = 100;
//     let elapsed = 0;
    
//     const check = () => {
//       const el = document.getElementById(id);
//       if (el) {
//         console.log(`✅ Élément ${id} trouvé après ${elapsed}ms`);
//         return resolve(el);
//       }
//       elapsed += interval;
//       if (elapsed >= timeout) {
//         console.error(`❌ Élément ${id} introuvable après ${timeout}ms`);
//         return reject(new Error(`Élément DOM ${id} introuvable après ${timeout}ms`));
//       }
//       setTimeout(check, interval);
//     };
    
//     check();
//   });
// };

// const ControlledQRScanner: React.FC<ControlledQRScannerProps> = ({
//   onScanSuccess,
//   onScanError,
//   isActive,
//   onScannerReady,
//   onScannerError,
// }) => {
//   const scannerRef = useRef<Html5QrcodeScanner | null>(null);
//   const [scannerState, setScannerState] = useState<'idle' | 'initializing' | 'ready' | 'scanning' | 'error'>('idle');
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [debugInfo, setDebugInfo] = useState<string[]>([]);
//   const [domReady, setDomReady] = useState(false);
//   const [isPWA, setIsPWA] = useState(false);
//   const isInitializing = useRef(false);
//   const isMounted = useRef(true);
//   const scannerId = 'controlled-qr-scanner';

//   // Fonction de debug
//   const addDebugInfo = useCallback((message: string) => {
//     console.log('🔍 QR Scanner:', message);
//     setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
//   }, []);

//   // Détecter si on est dans une PWA
//   useEffect(() => {
//     const detectPWA = () => {
//       const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
//                        window.matchMedia('(display-mode: fullscreen)').matches ||
//                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                        (window.navigator as { standalone?: boolean }).standalone === true ||
//                        document.referrer.includes('android-app://');
      
//       setIsPWA(isPWAMode);
//       addDebugInfo(`Mode PWA détecté: ${isPWAMode}`);
//     };
    
//     detectPWA();
//   }, [addDebugInfo]);

//   // Vérifier la compatibilité du navigateur
//   const checkBrowserCompatibility = useCallback(() => {
//     const issues = [];
    
//     if (!navigator.mediaDevices) {
//       issues.push('navigator.mediaDevices non disponible');
//     }
    
//     if (!navigator.mediaDevices?.getUserMedia) {
//       issues.push('getUserMedia non supporté');
//     }
    
//     if (!window.HTMLVideoElement) {
//       issues.push('HTMLVideoElement non supporté');
//     }
    
//     // Vérifier le contexte de sécurité
//     if (typeof window !== 'undefined') {
//       const isSecureContext = window.isSecureContext;
//       if (!isSecureContext) {
//         issues.push('Contexte non sécurisé (HTTPS requis)');
//       }
//     }
    
//     return issues;
//   }, []);

//   // Vérifier les permissions caméra avec gestion spéciale PWA
//   const checkCameraPermission = useCallback(async (retryCount = 0) => {
//     try {
//       addDebugInfo('Vérification des permissions caméra...');
      
//       // Vérifier la compatibilité d'abord
//       const compatibilityIssues = checkBrowserCompatibility();
//       if (compatibilityIssues.length > 0) {
//         throw new Error(`Incompatibilité: ${compatibilityIssues.join(', ')}`);
//       }

//       // Vérifier les permissions avec l'API Permissions si disponible
//       if ('permissions' in navigator) {
//         try {
//           const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
//           addDebugInfo(`Permission caméra: ${permission.state}`);
          
//           if (permission.state === 'denied') {
//             throw new Error('Permission caméra refusée par l\'utilisateur');
//           }
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         } catch {
//           addDebugInfo('API Permissions non disponible ou erreur');
//         }
//       }

//       // Contraintes adaptées pour PWA
//       const constraints = isPWA ? {
//         video: {
//           facingMode: 'environment',
//           width: { min: 320, ideal: 640, max: 1920 },
//           height: { min: 240, ideal: 480, max: 1080 }
//         }
//       } : {
//         video: {
//           facingMode: 'environment',
//           width: { ideal: 640 },
//           height: { ideal: 480 }
//         }
//       };

//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
//       if (!stream || stream.getTracks().length === 0) {
//         throw new Error('Stream caméra invalide');
//       }
      
//       addDebugInfo(`Caméra accessible: ${stream.getTracks().length} tracks`);
      
//       // Libérer immédiatement le stream
//       stream.getTracks().forEach(track => {
//         track.stop();
//         addDebugInfo(`Track ${track.kind} libéré`);
//       });
      
//       return true;
      
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
//       addDebugInfo(`Erreur permission (tentative ${retryCount + 1}): ${errorMessage}`);
      
//       // Retry avec des contraintes plus souples
//       if (retryCount === 0) {
//         try {
//           await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre avant retry
//           const simpleConstraints = { video: true };
//           const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
//           stream.getTracks().forEach(track => track.stop());
//           addDebugInfo('Caméra accessible avec contraintes simples');
//           return true;
//         } catch (retryError) {
//           const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Erreur inconnue';
//           addDebugInfo(`Retry échoué: ${retryErrorMessage}`);
//         }
//       }
      
//       throw error;
//     }
//   }, [addDebugInfo, checkBrowserCompatibility, isPWA]);

//   // Callbacks stables pour le scanner
//   const handleScanSuccess = useCallback((decodedText: string) => {
//     addDebugInfo(`QR Code détecté: ${decodedText.substring(0, 20)}...`);
//     onScanSuccess(decodedText);
//   }, [onScanSuccess, addDebugInfo]);

//   const handleScanError = useCallback((error: string) => {
//     // Filtrer les erreurs normales de scan
//     if (error.includes('NotFoundException') || 
//         error.includes('No QR code found') ||
//         error.includes('QR code parse error') ||
//         error.includes('NotFoundError')) {
//       return;
//     }
    
//     addDebugInfo(`Erreur de scan: ${error}`);
//     if (onScanError) {
//       onScanError(error);
//     }
//   }, [onScanError, addDebugInfo]);

//   // Initialiser le scanner avec configuration PWA
//   const initializeScanner = useCallback(async () => {
//     if (isInitializing.current || scannerRef.current || !isMounted.current || !domReady) {
//       addDebugInfo('Initialisation ignorée (déjà en cours, DOM non prêt ou composant démonté)');
//       return;
//     }
    
//     try {
//       isInitializing.current = true;
//       setScannerState('initializing');
//       addDebugInfo('Début initialisation scanner');
      
//       // Attendre un peu plus longtemps pour les PWA
//       if (isPWA) {
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }
      
//       // Vérifier les permissions d'abord
//       await checkCameraPermission();
      
//       if (!isMounted.current) return;
      
//       // Attendre que l'élément DOM soit disponible
//       addDebugInfo(`Attente de l'élément DOM ${scannerId}...`);
//       await waitForElement(scannerId, 8000); // Timeout plus long pour PWA
      
//       if (!isMounted.current) return;
      
//       // Configuration du scanner adaptée pour PWA
//       const config = {
//         fps: isPWA ? 8 : 10, // FPS plus bas pour PWA
//         qrbox: { width: 250, height: 250 },
//         rememberLastUsedCamera: true,
//         aspectRatio: 1.0,
//         showTorchButtonIfSupported: true,
//         showZoomSliderIfSupported: false,
//         defaultZoomValueIfSupported: 1,
//         supportedScanTypes: [],
//         experimentalFeatures: {
//           useBarCodeDetectorIfSupported: !isPWA // Désactiver pour PWA
//         },
//         // Options spéciales pour PWA
//         videoConstraints: isPWA ? {
//           facingMode: 'environment',
//           width: { min: 320, ideal: 640 },
//           height: { min: 240, ideal: 480 }
//         } : undefined
//       };

//       addDebugInfo('Création de l\'instance Html5QrcodeScanner');
//       scannerRef.current = new Html5QrcodeScanner(scannerId, config, false);
      
//       if (!isMounted.current) return;
      
//       addDebugInfo('Scanner initialisé avec succès');
//       setScannerState('ready');
//       setErrorMessage(null);
      
//       if (onScannerReady) {
//         onScannerReady();
//       }
      
//     } catch (error: unknown) {
//       const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'initialisation';
//       addDebugInfo(`Erreur initialisation: ${errorMessage}`);
//       setScannerState('error');
//       setErrorMessage(errorMessage);
//       if (onScannerError) {
//         onScannerError(errorMessage);
//       }
//     } finally {
//       isInitializing.current = false;
//     }
//   }, [checkCameraPermission, onScannerReady, onScannerError, addDebugInfo, domReady, isPWA]);

//   // Démarrer le scan
//   const startScanning = useCallback(async () => {
//     if (!scannerRef.current || scannerState !== 'ready' || !isMounted.current) {
//       addDebugInfo('Démarrage ignoré - scanner non prêt');
//       return;
//     }
    
//     try {
//       addDebugInfo('Démarrage du scan');
//       setScannerState('scanning');
      
//       // Attendre plus longtemps pour les PWA
//       await new Promise(resolve => setTimeout(resolve, isPWA ? 300 : 100));
      
//       if (!isMounted.current) return;
      
//       await scannerRef.current.render(handleScanSuccess, handleScanError);
//       addDebugInfo('Scanner démarré avec succès');
      
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
//       addDebugInfo(`Erreur démarrage: ${errorMessage}`);
//       setScannerState('error');
//       setErrorMessage(errorMessage);
//     }
//   }, [handleScanSuccess, handleScanError, scannerState, addDebugInfo, isPWA]);

//   // Arrêter le scan
//   const stopScanning = useCallback(async () => {
//     if (!scannerRef.current || !isMounted.current) return;
    
//     try {
//       addDebugInfo('Arrêt du scanner');
//       await scannerRef.current.clear();
//       setScannerState('ready');
//       addDebugInfo('Scanner arrêté');
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
//       addDebugInfo(`Erreur arrêt: ${errorMessage}`);
//     }
//   }, [addDebugInfo]);

//   // Nettoyer le scanner
//   const cleanup = useCallback(async () => {
//     if (scannerRef.current) {
//       try {
//         addDebugInfo('Nettoyage du scanner');
//         await scannerRef.current.clear();
//         scannerRef.current = null;
//         setScannerState('idle');
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
//         addDebugInfo(`Erreur nettoyage: ${errorMessage}`);
//       }
//     }
//   }, [addDebugInfo]);

//   // Redémarrer le scanner
//   const restartScanner = useCallback(async () => {
//     addDebugInfo('Redémarrage du scanner');
//     await cleanup();
//     await new Promise(resolve => setTimeout(resolve, isPWA ? 1000 : 500));
//     if (isMounted.current) {
//       await initializeScanner();
//     }
//   }, [cleanup, initializeScanner, addDebugInfo, isPWA]);

//   // Effect pour vérifier que le DOM est prêt
//   useEffect(() => {
//     isMounted.current = true;
    
//     const checkDomReady = () => {
//       const element = document.getElementById(scannerId);
//       if (element) {
//         addDebugInfo('DOM prêt, élément trouvé');
//         setDomReady(true);
//       } else {
//         addDebugInfo('DOM non prêt, élément introuvable');
//         setTimeout(checkDomReady, 100);
//       }
//     };
    
//     const timer = setTimeout(checkDomReady, isPWA ? 200 : 50);
    
//     return () => {
//       isMounted.current = false;
//       clearTimeout(timer);
//       cleanup();
//     };
//   }, [addDebugInfo, cleanup, isPWA]);

//   // Effect pour l'initialisation une fois que le DOM est prêt
//   useEffect(() => {
//     if (domReady && isMounted.current) {
//       addDebugInfo('DOM prêt, initialisation du scanner');
//       initializeScanner();
//     }
//   }, [domReady, initializeScanner, addDebugInfo]);

//   // Effect pour contrôler le scanner
//   useEffect(() => {
//     if (!isMounted.current) return;
    
//     if (scannerState === 'ready' && isActive) {
//       startScanning();
//     } else if (scannerState === 'scanning' && !isActive) {
//       stopScanning();
//     }
//   }, [isActive, scannerState, startScanning, stopScanning]);

//   // Rendu selon l'état
//   if (scannerState === 'idle' || scannerState === 'initializing') {
//     return (
//       <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
//           <p className="text-gray-600 mb-2">
//             {scannerState === 'idle' ? 'Initialisation...' : 'Préparation de la caméra...'}
//           </p>
//           {isPWA && (
//             <p className="text-xs text-blue-600 mb-2">Mode PWA détecté</p>
//           )}
//           {debugInfo.length > 0 && (
//             <div className="text-xs text-gray-500 max-w-xs">
//               {debugInfo.map((info, index) => (
//                 <div key={index} className="truncate">{info}</div>
//               ))}
//             </div>
//           )}
//         </div>
//         <div id={scannerId} className="hidden" />
//       </div>
//     );
//   }

//   if (scannerState === 'error') {
//     return (
//       <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-red-200 p-4">
//         <div className="text-center">
//           <div className="text-red-500 mb-2">
//             <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <p className="text-red-600 font-semibold mb-1">Erreur de scanner</p>
//           <p className="text-red-500 text-sm mb-3 max-w-xs">{errorMessage}</p>
          
//           {isPWA && (
//             <div className="text-xs text-blue-600 mb-2 bg-blue-50 p-2 rounded">
//               <p>Mode PWA détecté</p>
//               <p>Assurez-vous d&apos;avoir autorisé l&apos;accès à la caméra</p>
//             </div>
//           )}
          
//           {debugInfo.length > 0 && (
//             <div className="text-xs text-gray-600 mb-3 max-w-xs">
//               <details>
//                 <summary className="cursor-pointer text-gray-500">Détails techniques</summary>
//                 <div className="mt-2 text-left">
//                   {debugInfo.map((info, index) => (
//                     <div key={index} className="break-all">{info}</div>
//                   ))}
//                 </div>
//               </details>
//             </div>
//           )}
          
//           <button
//             onClick={restartScanner}
//             className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
//           >
//             Réessayer
//           </button>
//         </div>
//         <div id={scannerId} className="hidden" />
//       </div>
//     );
//   }

//   return (
//     <div className="w-full relative">
//       <div id={scannerId} className="w-full" />
      
//       {scannerState === 'ready' && !isActive && (
//         <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
//           <div className="text-center text-white">
//             <div className="mb-2">
//               <svg className="w-12 h-12 mx-auto opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
//               </svg>
//             </div>
//             <p className="text-sm">Scanner prêt</p>
//             <p className="text-xs opacity-75">Cliquez sur &quot;Démarrer&quot; pour activer</p>
//             {isPWA && (
//               <p className="text-xs opacity-75 mt-1">Mode PWA</p>
//             )}
//           </div>
//         </div>
//       )}
      
//       {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
//         <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
//           <details>
//             <summary>Debug Info {isPWA && '(PWA Mode)'}</summary>
//             {debugInfo.map((info, index) => (
//               <div key={index}>{info}</div>
//             ))}
//           </details>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ControlledQRScanner;
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
  const [scannerState, setScannerState] = useState<'idle' | 'initializing' | 'ready' | 'scanning' | 'error' | 'permission-needed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [domReady, setDomReady] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [userInteractionRequired, setUserInteractionRequired] = useState(false);
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const scannerId = 'controlled-qr-scanner';

  // Fonction de debug
  const addDebugInfo = useCallback((message: string) => {
    console.log('🔍 QR Scanner:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // Détecter iOS et PWA
  useEffect(() => {
    const detectEnvironment = () => {
      // Détecter iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Détecter PWA
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: fullscreen)').matches ||
                       (window.navigator as { standalone?: boolean }).standalone === true ||
                       document.referrer.includes('android-app://');
      
      setIsIOS(isIOSDevice);
      setIsPWA(isPWAMode);
      addDebugInfo(`iOS: ${isIOSDevice}, PWA: ${isPWAMode}`);
    };
    
    detectEnvironment();
  }, [addDebugInfo]);

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
    
    // Vérifier le contexte de sécurité
    if (typeof window !== 'undefined') {
      const isSecureContext = window.isSecureContext;
      if (!isSecureContext) {
        issues.push('Contexte non sécurisé (HTTPS requis)');
      }
    }
    
    return issues;
  }, []);

  // Vérifier les permissions caméra avec gestion spéciale iOS
  const checkCameraPermission = useCallback(async (requireUserInteraction = false) => {
    try {
      addDebugInfo('Vérification des permissions caméra...');
      
      // Vérifier la compatibilité d'abord
      const compatibilityIssues = checkBrowserCompatibility();
      if (compatibilityIssues.length > 0) {
        throw new Error(`Incompatibilité: ${compatibilityIssues.join(', ')}`);
      }

      // Sur iOS, ne pas utiliser l'API Permissions qui est peu fiable
      if (!isIOS && 'permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          addDebugInfo(`Permission caméra: ${permission.state}`);
          
          if (permission.state === 'denied') {
            throw new Error('Permission caméra refusée par l\'utilisateur');
          }
        } catch {
          addDebugInfo('API Permissions non disponible ou erreur');
        }
      }

      // Contraintes spéciales pour iOS
      const constraints = isIOS ? {
        video: {
          facingMode: 'environment',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      } : isPWA ? {
        video: {
          facingMode: 'environment',
          width: { min: 320, ideal: 640, max: 1920 },
          height: { min: 240, ideal: 480, max: 1080 }
        }
      } : {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      // Sur iOS, toujours demander les permissions de manière simple
      if (isIOS || requireUserInteraction) {
        addDebugInfo('Demande de permission avec interaction utilisateur');
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
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
      }

      // Pour les autres plateformes, utiliser les contraintes complètes
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
      
      // Sur iOS, si c'est une erreur de permission, demander une interaction utilisateur
      if (isIOS && !requireUserInteraction && 
          (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed'))) {
        addDebugInfo('iOS: Interaction utilisateur requise pour les permissions');
        setUserInteractionRequired(true);
        setScannerState('permission-needed');
        return false;
      }
      
      throw error;
    }
  }, [addDebugInfo, checkBrowserCompatibility, isIOS, isPWA]);

  // Fonction pour demander les permissions avec interaction utilisateur
  const requestCameraPermissionWithUserInteraction = useCallback(async () => {
    try {
      addDebugInfo('Demande de permission avec interaction utilisateur');
      setUserInteractionRequired(false);
      setScannerState('initializing');
      
      await checkCameraPermission(true);
      
      if (isMounted.current) {
        await initializeScanner();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addDebugInfo(`Erreur lors de la demande de permission: ${errorMessage}`);
      setScannerState('error');
      setErrorMessage(errorMessage);
      if (onScannerError) {
        onScannerError(errorMessage);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addDebugInfo, checkCameraPermission, onScannerError]);

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
      if (isIOS) {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else if (isPWA) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Vérifier les permissions (sans interaction utilisateur pour l'instant)
      if (!userInteractionRequired) {
        await checkCameraPermission(false);
      }
      
      if (!isMounted.current) return;
      
      // Attendre que l'élément DOM soit disponible
      addDebugInfo(`Attente de l'élément DOM ${scannerId}...`);
      await waitForElement(scannerId, 10000); // Timeout plus long pour iOS
      
      if (!isMounted.current) return;
      
      // Configuration du scanner adaptée pour iOS
      const config = {
        fps: isIOS ? 6 : (isPWA ? 8 : 10), // FPS très bas pour iOS
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 1,
        supportedScanTypes: [],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: !isIOS // Toujours désactiver pour iOS
        },
        // Options spéciales pour iOS
        videoConstraints: isIOS ? {
          facingMode: 'environment',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        } : (isPWA ? {
          facingMode: 'environment',
          width: { min: 320, ideal: 640 },
          height: { min: 240, ideal: 480 }
        } : undefined)
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
  }, [checkCameraPermission, onScannerReady, onScannerError, addDebugInfo, domReady, isIOS, isPWA, userInteractionRequired]);

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
      await new Promise(resolve => setTimeout(resolve, isIOS ? 500 : (isPWA ? 300 : 100)));
      
      if (!isMounted.current) return;
      
      await scannerRef.current.render(handleScanSuccess, handleScanError);
      addDebugInfo('Scanner démarré avec succès');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addDebugInfo(`Erreur démarrage: ${errorMessage}`);
      
      // Sur iOS, si c'est une erreur de permission, demander une interaction utilisateur
      if (isIOS && (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed'))) {
        addDebugInfo('iOS: Redirection vers demande de permission avec interaction');
        setUserInteractionRequired(true);
        setScannerState('permission-needed');
        return;
      }
      
      setScannerState('error');
      setErrorMessage(errorMessage);
    }
  }, [handleScanSuccess, handleScanError, scannerState, addDebugInfo, isIOS, isPWA]);

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
    await new Promise(resolve => setTimeout(resolve, isIOS ? 1500 : (isPWA ? 1000 : 500)));
    if (isMounted.current) {
      setUserInteractionRequired(false);
      await initializeScanner();
    }
  }, [cleanup, initializeScanner, addDebugInfo, isIOS, isPWA]);

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
    
    const timer = setTimeout(checkDomReady, isIOS ? 300 : (isPWA ? 200 : 50));
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [addDebugInfo, cleanup, isIOS, isPWA]);

  // Effect pour l'initialisation une fois que le DOM est prêt
  useEffect(() => {
    if (domReady && isMounted.current && !userInteractionRequired) {
      addDebugInfo('DOM prêt, initialisation du scanner');
      initializeScanner();
    }
  }, [domReady, initializeScanner, addDebugInfo, userInteractionRequired]);

  // Effect pour contrôler le scanner
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (scannerState === 'ready' && isActive) {
      startScanning();
    } else if (scannerState === 'scanning' && !isActive) {
      stopScanning();
    }
  }, [isActive, scannerState, startScanning, stopScanning]);

  // État : Permission nécessaire (spécial iOS)
  if (scannerState === 'permission-needed' || userInteractionRequired) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
        <div className="text-center">
          <div className="text-blue-500 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-blue-700 font-semibold mb-2">Autorisation caméra requise</p>
          <p className="text-blue-600 text-sm mb-4 max-w-xs">
            {isIOS ? 
              'Sur iOS, veuillez cliquer sur le bouton pour autoriser l\'accès à la caméra' : 
              'Cliquez pour autoriser l\'accès à la caméra'
            }
          </p>
          
          <button
            onClick={requestCameraPermissionWithUserInteraction}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            Autoriser la caméra
          </button>
          
          {isIOS && (
            <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
              Mode iOS PWA - Interaction utilisateur requise
            </div>
          )}
        </div>
        <div id={scannerId} className="hidden" />
      </div>
    );
  }

  // Rendu selon l'état (reste identique)
  if (scannerState === 'idle' || scannerState === 'initializing') {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 mb-2">
            {scannerState === 'idle' ? 'Initialisation...' : 'Préparation de la caméra...'}
          </p>
          {(isPWA || isIOS) && (
            <p className="text-xs text-blue-600 mb-2">
              {isIOS ? 'Mode iOS PWA' : 'Mode PWA'}
            </p>
          )}
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
          
          {isIOS && (
            <div className="text-xs text-orange-600 mb-2 bg-orange-50 p-2 rounded">
              <p>Mode iOS PWA détecté</p>
              <p>Problème d&apos;autorisation caméra possible</p>
            </div>
          )}
          
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
            {isIOS && (
              <p className="text-xs opacity-75 mt-1">Mode iOS PWA</p>
            )}
          </div>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <details>
            <summary>Debug Info {isIOS ? '(iOS PWA)' : (isPWA ? '(PWA)' : '')}</summary>
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