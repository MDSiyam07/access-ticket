'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ControlledQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean;
  onScannerReady?: () => void;
  onScannerError?: (error: string) => void;
}

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
  // const [debugInfo, setDebugInfo] = useState<string[]>([]);
  // const [domReady, setDomReady] = useState(false);
  // const [isPWA, setIsPWA] = useState(false);
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const scannerId = 'controlled-qr-scanner';
  const [retryCount, setRetryCount] = useState(0);

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
//       <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center">
//         <div className="text-center p-8">
//           <div className="relative mb-6">
//             <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
//               <Camera className="w-8 h-8 text-white" />
//             </div>
//             <div className="absolute -inset-2 border-4 border-blue-200 rounded-full animate-ping"></div>
//           </div>
  
//           <h3 className="text-xl font-semibold text-gray-800 mb-2">
//             Préparation du scanner
//           </h3>
//           <p className="text-gray-600 mb-2">
//             {scannerState === 'idle' ? 'Initialisation...' : 'Préparation de la caméra...'}
//           </p>
  
//           {isPWA && (
//             <p className="text-xs text-blue-600 mb-2">Mode PWA détecté</p>
//           )}
  
//           {debugInfo.length > 0 && (
//             <div className="text-xs text-gray-500 max-w-xs mx-auto mb-2">
//               {debugInfo.map((info, index) => (
//                 <div key={index} className="truncate">{info}</div>
//               ))}
//             </div>
//           )}
  
//           <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
//             <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
//             <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//             <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//           </div>
//         </div>
//         <div id={scannerId} className="hidden" />
//       </div>
//     );
//   }
  
//   if (scannerState === 'error') {
//     return (
//       <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-100 rounded-xl flex items-center justify-center">
//         <div className="text-center p-8 max-w-sm">
//           <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
//             <AlertCircle className="w-8 h-8 text-white" />
//           </div>
  
//           <h3 className="text-xl font-semibold text-gray-800 mb-2">
//             Oups ! Un problème est survenu
//           </h3>
  
//           <p className="text-red-600 text-sm mb-3">
//             {errorMessage?.includes('refusé') || errorMessage?.includes('denied') 
//               ? "L'accès à la caméra est requis. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
//               : errorMessage || "Impossible d'accéder à la caméra. Vérifiez que votre appareil dispose d'une caméra et que le navigateur est à jour."
//             }
//           </p>
  
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
  
//           <Button
//             onClick={restartScanner}
//             className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
//           >
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Réessayer {retryCount > 0 && `(${retryCount})`}
//           </Button>
  
//           <p className="text-xs text-gray-500 mt-4">
//             Astuce : Rechargez la page si le problème persiste
//           </p>
//         </div>
//         <div id={scannerId} className="hidden" />
//       </div>
//     );
//   }
  
//   return (
//     <div className="w-full h-full relative bg-black rounded-xl overflow-hidden">
//       <div id={scannerId} className="w-full h-full" />
  
//       {scannerState === 'ready' && !isActive && (
//         <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
//           <div className="text-center text-white p-8">
//             <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
//               <Camera className="w-10 h-10" />
//             </div>
//             <h3 className="text-2xl font-bold mb-2">Scanner prêt</h3>
//             <p className="text-gray-300 mb-2">
//               Appuyez sur &quot;Démarrer le scan&quot; pour activer la caméra
//             </p>
//             {isPWA && (
//               <p className="text-xs opacity-75 mt-1">Mode PWA</p>
//             )}
//             <div className="flex items-center justify-center space-x-2 text-sm text-green-400 mt-2">
//               <Zap className="w-4 h-4" />
//               <span>Caméra initialisée</span>
//             </div>
//           </div>
//         </div>
//       )}
  
//       {scannerState === 'scanning' && (
//         <div className="absolute top-4 left-4 right-4">
//           <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-4 text-center">
//             <p className="text-white text-sm font-medium">
//               📱 Pointez la caméra vers le QR code
//             </p>
//             <p className="text-gray-300 text-xs mt-1">
//               Le scan se fera automatiquement
//             </p>
//           </div>
//         </div>
//       )}
  
//       {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
//         <div className="absolute bottom-2 left-2 right-2 text-xs text-gray-500 bg-gray-50 bg-opacity-90 p-2 rounded">
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
// Vérifier les permissions et compatibilité
const checkCameraAccess = useCallback(async () => {
  try {
    // Vérifier d'abord si l'API est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('API caméra non supportée');
    }

    // Test simple de l'accès caméra - ne pas libérer immédiatement
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment'
      }
    });
    
    // Vérifier que le stream est valide
    if (!stream || stream.getTracks().length === 0) {
      throw new Error('Stream caméra invalide');
    }

    // Libérer le stream après un délai plus long pour éviter les conflits
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
    }, 500);

    return true;
  } catch (error) {
    console.error('Camera access error:', error);
    
    // Messages d'erreur plus spécifiques
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('Aucune caméra trouvée sur cet appareil.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra.');
      }
    }
    
    throw error;
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
    await checkCameraAccess();
    
    if (!isMounted.current) return;
    
    // Attendre l'élément DOM
    await waitForElement(scannerId);
    
    if (!isMounted.current) return;
    
    // Configuration robuste pour différents appareils
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: false,
      defaultZoomValueIfSupported: 1,
      supportedScanTypes: [],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: false
      }
    };

    console.log('Initialisation du scanner avec config:', config);
    scannerRef.current = new Html5QrcodeScanner(scannerId, config, false);
    
    if (!isMounted.current) return;
    
    setScannerState('ready');
    setRetryCount(0);
    
    if (onScannerReady) {
      onScannerReady();
    }
    
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur d\'initialisation';
    console.error('Erreur initialisation scanner:', error);
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
    console.log('Démarrage ignoré:', { 
      hasScanner: !!scannerRef.current, 
      state: scannerState, 
      isMounted: isMounted.current 
    });
    return;
  }
  
  try {
    console.log('Démarrage du scan...');
    setScannerState('scanning');
    await scannerRef.current.render(handleScanSuccess, handleScanError);
    console.log('Scanner démarré avec succès');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur de démarrage';
    console.error('Erreur démarrage scanner:', error);
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
            <div className="w-full h-full bg-gradient-to-br from-red-50 to-gray-100 rounded-xl flex items-center justify-center">
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

export default ControlledQRScanner;