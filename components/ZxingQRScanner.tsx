// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { BrowserMultiFormatReader } from "@zxing/browser";
// import { Result } from "@zxing/library";

// interface ZxingQRScannerProps {
//   onScan?: (ticketId: string) => void;
//   isActive?: boolean;
// }

// export default function ZxingQRScanner({ 
//   onScan, 
//   isActive = false
// }: ZxingQRScannerProps) {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const displayCanvasRef = useRef<HTMLCanvasElement>(null);
//   const codeReader = useRef(new BrowserMultiFormatReader());
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const isStartingRef = useRef(false);
//   const hasStartedRef = useRef(false);
//   const previousIsActiveRef = useRef(false);

//   const [error, setError] = useState<string | null>(null);
//   const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

//   // Fonction de capture et décodage
//   const captureFrameAndDecode = useCallback(() => {
//     if (!videoRef.current || !displayCanvasRef.current) return;

//     const video = videoRef.current;
//     const displayCanvas = displayCanvasRef.current;
//     const displayContext = displayCanvas.getContext("2d");

//     if (!displayContext) return;

//     // Vérifier si la vidéo a des dimensions valides
//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       return;
//     }

//     // Créer un canvas temporaire pour capturer la frame
//     const tempCanvas = document.createElement("canvas");
//     const tempContext = tempCanvas.getContext("2d");
//     if (!tempContext) return;

//     tempCanvas.width = video.videoWidth;
//     tempCanvas.height = video.videoHeight;
//     tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

//     // Ajuster la taille du canvas d'affichage
//     displayCanvas.width = video.videoWidth;
//     displayCanvas.height = video.videoHeight;
    
//     // Copier sur le canvas d'affichage
//     displayContext.drawImage(tempCanvas, 0, 0);

//     // Décoder
//     const decodeCanvas = async () => {
//       try {
//         const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
//         const decodedText = result.getText();
        
//         if (decodedText && decodedText !== lastScannedCode) {
//           console.log('🎯 QR Code détecté:', decodedText);
//           setLastScannedCode(decodedText);
          
//           if (onScan) {
//             onScan(decodedText);
//           }
//         }
//       } catch (err: unknown) {
//         if (err instanceof Error && err.name !== "NotFoundException") {
//           console.error("❌ Decoding error:", err);
//         }
//       }
//     };

//     decodeCanvas();
//   }, [lastScannedCode, onScan]);

//   // Effet principal
//   useEffect(() => {
//     if (previousIsActiveRef.current === isActive) {
//       return;
//     }

//     previousIsActiveRef.current = isActive;

//     if (!isActive) {
//       console.log('🧹 Nettoyage de la caméra...');
      
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
      
//       if (streamRef.current) {
//         const tracks = streamRef.current.getTracks();
//         tracks.forEach((track) => track.stop());
//         streamRef.current = null;
//       }
      
//       if (videoRef.current) {
//         videoRef.current.srcObject = null;
//       }
      
//       hasStartedRef.current = false;
//       isStartingRef.current = false;
//       setLastScannedCode(null);
//       return;
//     }

//     if (hasStartedRef.current || isStartingRef.current) {
//       return;
//     }

//     isStartingRef.current = true;
//     hasStartedRef.current = true;

//     const startCamera = async () => {
//       try {
//         setError(null);
//         setLastScannedCode(null);
//         console.log('📷 Démarrage de la caméra...');

//         if (streamRef.current) {
//           const tracks = streamRef.current.getTracks();
//           tracks.forEach((track) => track.stop());
//           streamRef.current = null;
//           await new Promise(resolve => setTimeout(resolve, 100));
//         }

//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             facingMode: { ideal: "environment" },
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//           },
//         });

//         streamRef.current = stream;
//         console.log('✅ Stream obtenu, tracks:', stream.getTracks().map(t => t.kind));

//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;

//           videoRef.current.onloadedmetadata = async () => {
//             try {
//               await videoRef.current?.play();
//               console.log("📹 Vidéo prête, démarrage du décodage...");
//               intervalRef.current = setInterval(captureFrameAndDecode, 100);
//               isStartingRef.current = false;
//             } catch (playError) {
//               console.error("❌ Erreur lors du démarrage de la vidéo:", playError);
//               setError("Impossible de démarrer la vidéo. Autorisez l'accès à la caméra.");
//               isStartingRef.current = false;
//             }
//           };
//         }
//       } catch (err) {
//         console.error("❌ Camera error:", err);
//         setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
//         isStartingRef.current = false;
//         hasStartedRef.current = false;
//       }
//     };

//     startCamera();

//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//       }
//       if (streamRef.current) {
//         const tracks = streamRef.current.getTracks();
//         tracks.forEach((track) => track.stop());
//       }
//       if (videoRef.current) {
//         videoRef.current.srcObject = null;
//       }
//       hasStartedRef.current = false;
//       isStartingRef.current = false;
//     };
//   }, [isActive]);

//   if (!isActive) {
//     return (
//       <div className="w-full h-full flex items-center justify-center">
//         <p className="text-gray-500">Scanner inactif</p>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-full">
//       <div className="relative w-full h-full">
//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-full object-cover"
//         />
//         <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none">
//           <div className="absolute inset-4 border-2 border-blue-500 rounded-lg"></div>
//         </div>
//       </div>

//       <canvas
//         ref={displayCanvasRef}
//         className="w-full h-32 object-cover rounded-lg border-2 border-green-500 mt-2"
//         style={{
//           border: "2px solid #10b981",
//           borderRadius: "0.5rem",
//           maxWidth: "100%",
//           height: "auto",
//           display: "block",
//         }}
//       />

//       {error && (
//         <div className="flex items-center space-x-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg mt-2">
//           <span>{error}</span>
//         </div>
//       )}

//       {lastScannedCode && (
//         <div className="mt-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
//           <p className="text-green-800 font-medium">✅ Code scanné : {lastScannedCode}</p>
//         </div>
//       )}
//     </div>
//   );
// }

// 2eme version
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { Result } from "@zxing/library";

interface ZxingQRScannerProps {
  onScan?: (ticketId: string) => void;
  isActive?: boolean;
}

export default function ZxingQRScanner({
  onScan,
  isActive = false,
}: ZxingQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const previousIsActiveRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Décodage de la frame vidéo
  const captureFrameAndDecode = useCallback(() => {
    if (!videoRef.current || !displayCanvasRef.current) return;

    const video = videoRef.current;
    const displayCanvas = displayCanvasRef.current;
    const displayContext = displayCanvas.getContext("2d");
    if (!displayContext) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Dessin de la frame dans un canvas temporaire puis dans le canvas d'affichage
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    if (!tempContext) return;

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    displayCanvas.width = video.videoWidth;
    displayCanvas.height = video.videoHeight;
    displayContext.drawImage(tempCanvas, 0, 0);

    (async () => {
      try {
        const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
        const decodedText = result.getText();

        if (decodedText && decodedText !== lastScannedCode) {
          setLastScannedCode(decodedText);
          if (onScan) onScan(decodedText);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "NotFoundException") {
          console.error("❌ Decoding error:", err);
        }
      }
    })();
  }, [lastScannedCode, onScan]);

  // Effet principal : démarre ou arrête la caméra selon isActive
  useEffect(() => {
    if (previousIsActiveRef.current === isActive) return;

    previousIsActiveRef.current = isActive;

    // Arrêt du scan et nettoyage
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
      hasStartedRef.current = false;
      isStartingRef.current = false;
      setLastScannedCode(null);
      setIsVideoLoading(false);
      setError(null);
      return;
    }

    // Si déjà démarré ou en démarrage, on ne relance pas
    if (hasStartedRef.current || isStartingRef.current) return;

    isStartingRef.current = true;
    hasStartedRef.current = true;
    setError(null);
    setLastScannedCode(null);
    setIsVideoLoading(true);

    let loadedMetadataHandler: (() => void) | null = null;
    let errorHandler: ((e: Event) => void) | null = null;

    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          await new Promise((r) => setTimeout(r, 100));
        }
        console.log("📷 Appel à getUserMedia...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        console.log("✅ Stream obtenu", stream);

        streamRef.current = stream;
        if (!videoRef.current) throw new Error("Video element not found");
        videoRef.current.srcObject = stream;

        loadedMetadataHandler = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setIsVideoLoading(false);
              intervalRef.current = setInterval(captureFrameAndDecode, 100);
              isStartingRef.current = false;
            })
            .catch((playError) => {
              setError("Impossible de démarrer la vidéo. Rechargez la page.");
              setIsVideoLoading(false);
              isStartingRef.current = false;
              console.error("Erreur play video:", playError);
            });
        };

        errorHandler = (e: Event) => {
          setError("Erreur lors du chargement de la vidéo.");
          setIsVideoLoading(false);
          isStartingRef.current = false;
          console.error("Erreur video:", e);
        };

        videoRef.current.addEventListener("loadedmetadata", loadedMetadataHandler, {
          once: true,
        });
        videoRef.current.addEventListener("error", errorHandler, { once: true });

        // Timeout sécurité
        setTimeout(() => {
          if (isStartingRef.current) {
            setError("Timeout lors du chargement. Cliquez sur Réessayer.");
            setIsVideoLoading(false);
            isStartingRef.current = false;
          }
        }, 10000);
      } catch (err) {
        setIsVideoLoading(false);
        setError(
          err instanceof Error
            ? err.message
            : "Impossible d'accéder à la caméra."
        );
        isStartingRef.current = false;
        hasStartedRef.current = false;
        console.error("Erreur getUserMedia:", err);
      }
    };

    startCamera();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadedmetadata", loadedMetadataHandler!);
        videoRef.current.removeEventListener("error", errorHandler!);
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
      hasStartedRef.current = false;
      isStartingRef.current = false;
    };
  }, [isActive, captureFrameAndDecode]);

  // Retry du scan
  const retry = useCallback(() => {
    setError(null);
    setIsVideoLoading(true);
    hasStartedRef.current = false;
    isStartingRef.current = false;

    // Forcer la relance en modifiant previousIsActiveRef
    previousIsActiveRef.current = !isActive;
    setTimeout(() => {
      previousIsActiveRef.current = isActive;
      // Pas besoin d'autre setState, le useEffect se déclenche
    }, 100);
  }, [isActive]);

  if (!isActive) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Scanner inactif</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover bg-black"
      />
      {isVideoLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2" />
          Chargement de la caméra...
        </div>
      )}
      <canvas
        ref={displayCanvasRef}
        className="w-full h-32 object-cover rounded-lg border-2 border-green-500 mt-2"
        style={{
          borderRadius: "0.5rem",
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />
      {error && (
        <div className="flex items-center justify-between text-red-600 text-sm p-3 bg-red-50 rounded-lg mt-2">
          <span>{error}</span>
          <button
            onClick={retry}
            className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}
      {lastScannedCode && (
        <div className="mt-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Code scanné : {lastScannedCode}</p>
        </div>
      )}
    </div>
  );
}
