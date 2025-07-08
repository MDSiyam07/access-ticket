"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";

interface ZxingQRScannerProps {
  onScan?: (ticketId: string) => void;
  isActive?: boolean;
}

export default function ZxingQRScanner({ 
  onScan, 
  isActive = false
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

  // Fonction de capture et décodage
  const captureFrameAndDecode = useCallback(() => {
    if (!videoRef.current || !displayCanvasRef.current) return;

    const video = videoRef.current;
    const displayCanvas = displayCanvasRef.current;
    const displayContext = displayCanvas.getContext("2d");

    if (!displayContext) return;

    // Vérifier si la vidéo a des dimensions valides
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Créer un canvas temporaire pour capturer la frame
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    if (!tempContext) return;

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Ajuster la taille du canvas d'affichage
    displayCanvas.width = video.videoWidth;
    displayCanvas.height = video.videoHeight;
    
    // Copier sur le canvas d'affichage
    displayContext.drawImage(tempCanvas, 0, 0);

    // Décoder
    const decodeCanvas = async () => {
      try {
        const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
        const decodedText = result.getText();
        
        if (decodedText && decodedText !== lastScannedCode) {
          console.log('🎯 QR Code détecté:', decodedText);
          setLastScannedCode(decodedText);
          
          if (onScan) {
            onScan(decodedText);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "NotFoundException") {
          console.error("❌ Decoding error:", err);
        }
      }
    };

    decodeCanvas();
  }, [lastScannedCode, onScan]);

  // Effet principal
  useEffect(() => {
    if (previousIsActiveRef.current === isActive) {
      return;
    }

    previousIsActiveRef.current = isActive;

    if (!isActive) {
      console.log('🧹 Nettoyage de la caméra...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      hasStartedRef.current = false;
      isStartingRef.current = false;
      setLastScannedCode(null);
      return;
    }

    if (hasStartedRef.current || isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    hasStartedRef.current = true;

    const startCamera = async () => {
      try {
        setError(null);
        setLastScannedCode(null);
        console.log('📷 Démarrage de la caméra...');

        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          tracks.forEach((track) => track.stop());
          streamRef.current = null;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;
        console.log('✅ Stream obtenu, tracks:', stream.getTracks().map(t => t.kind));

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              console.log("📹 Vidéo prête, démarrage du décodage...");
              intervalRef.current = setInterval(captureFrameAndDecode, 100);
              isStartingRef.current = false;
            } catch (playError) {
              console.error("❌ Erreur lors du démarrage de la vidéo:", playError);
              setError("Impossible de démarrer la vidéo. Autorisez l'accès à la caméra.");
              isStartingRef.current = false;
            }
          };
        }
      } catch (err) {
        console.error("❌ Camera error:", err);
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        isStartingRef.current = false;
        hasStartedRef.current = false;
      }
    };

    startCamera();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      hasStartedRef.current = false;
      isStartingRef.current = false;
    };
  }, [isActive]);

  if (!isActive) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Scanner inactif</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none">
          <div className="absolute inset-4 border-2 border-blue-500 rounded-lg"></div>
        </div>
      </div>

      <canvas
        ref={displayCanvasRef}
        className="w-full h-32 object-cover rounded-lg border-2 border-green-500 mt-2"
        style={{
          border: "2px solid #10b981",
          borderRadius: "0.5rem",
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg mt-2">
          <span>{error}</span>
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