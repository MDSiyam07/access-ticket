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

  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Fonction de capture et décodage inspirée du code fonctionnel
  const captureFrameAndDecode = useCallback(() => {
    if (!videoRef.current || !displayCanvasRef.current) return;

    const video = videoRef.current;
    const displayCanvas = displayCanvasRef.current;
    const displayContext = displayCanvas.getContext("2d");

    if (!displayContext) return;

    // Créer un canvas temporaire pour capturer la frame complète (comme dans le code fonctionnel)
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

    // Décoder de manière synchrone dans la fonction (comme dans le code fonctionnel)
    const decodeCanvas = async () => {
      try {
        const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
        const decodedText = result.getText();
        
        // Éviter les scans multiples du même code
        if (decodedText && decodedText !== lastScannedCode) {
          console.log('🎯 QR Code détecté:', decodedText);
          setLastScannedCode(decodedText);
          
          // Appeler la fonction de callback avec le code scanné
          if (onScan) {
            onScan(decodedText);
          }
        }
      } catch (err: unknown) {
        // Ignorer les erreurs "NotFoundException" (pas de QR code trouvé)
        if (err instanceof Error && err.name !== "NotFoundException") {
          console.error("❌ Decoding error:", err);
        }
      }
    };

    // Appeler decodeCanvas directement (comme dans le code fonctionnel)
    decodeCanvas();
  }, [lastScannedCode, onScan]);

  // Effet principal inspiré du code fonctionnel
  const hasStartedCameraRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      // Nettoyage standard
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      hasStartedCameraRef.current = false; // ✅ reset si on désactive
      setLastScannedCode(null);
      return;
    }

    // ✅ éviter double appel
    if (hasStartedCameraRef.current) return;
    hasStartedCameraRef.current = true;

    const startCamera = async () => {
      try {
        setError(null);
        setLastScannedCode(null);
        console.log('📷 Démarrage de la caméra...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              console.log("📹 Vidéo prête, démarrage du décodage...");
              intervalRef.current = setInterval(captureFrameAndDecode, 100);
            } catch (playError) {
              console.error("❌ Erreur lors du démarrage de la vidéo:", playError);
              setError("Impossible de démarrer la vidéo. Autorisez l'accès à la caméra.");
            }
          };
        }
      } catch (err) {
        console.error("❌ Camera error:", err);
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      hasStartedCameraRef.current = false;
    };
  }, [isActive, captureFrameAndDecode]);


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