"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";

const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.4;

export default function ZxingScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  const [error, setError] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!cameraActive) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            intervalId = setInterval(captureFrameAndCrop, 100);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Impossible d'accéder à la caméra. Vérifie les permissions.");
      }
    };

    const captureFrameAndCrop = () => {
      if (!videoRef.current || !displayCroppedCanvasRef.current || !cropOverlayRef.current) return;

      const video = videoRef.current;
      const displayCanvas = displayCroppedCanvasRef.current;
      const displayContext = displayCanvas.getContext("2d");
      const overlayDiv = cropOverlayRef.current;

      if (!displayContext) return;

      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      if (!tempContext) return;

      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      let cropWidth, cropHeight;
      const videoRatio = video.videoWidth / video.videoHeight;

      if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
        cropHeight = video.videoHeight * CROP_SIZE_FACTOR;
        cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO;
      } else {
        cropWidth = video.videoWidth * CROP_SIZE_FACTOR;
        cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO;
      }

      const MIN_CROP_WIDTH = 240;
      const MAX_CROP_WIDTH = 600;
      const MIN_CROP_HEIGHT = 80;
      const MAX_CROP_HEIGHT = 400;

      cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, cropWidth));
      cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, cropHeight));

      const cropX = (video.videoWidth - cropWidth) / 2;
      const cropY = (video.videoHeight - cropHeight) / 2;

      displayCanvas.width = cropWidth;
      displayCanvas.height = cropHeight;

      displayContext.drawImage(
        tempCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      Object.assign(overlayDiv.style, {
        position: "absolute",
        left: `${(cropX / video.videoWidth) * 100}%`,
        top: `${(cropY / video.videoHeight) * 100}%`,
        width: `${(cropWidth / video.videoWidth) * 100}%`,
        height: `${(cropHeight / video.videoHeight) * 100}%`,
        border: "2px solid white",
        borderRadius: "0.5rem",
        pointerEvents: "none",
        boxSizing: "border-box",
      });

      const decodeCanvas = async () => {
        try {
          const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
          setBarcodeResult(result.getText());
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "NotFoundException") {
            console.error("Decoding error:", err);
          }
        }
      };

      decodeCanvas();
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraActive]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>Scan de code-barres</h2>

      {!cameraActive && (
        <button
          onClick={() => setCameraActive(true)}
          style={{
            padding: "0.75rem 1.5rem",
            margin: "1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Activer la caméra
        </button>
      )}

      {cameraActive && (
        <>
          <div style={{ position: "relative", width: "100%", maxWidth: "400px", overflow: "hidden" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div ref={cropOverlayRef}></div>
          </div>

          <canvas
            ref={displayCroppedCanvasRef}
            style={{
              border: "2px solid #3b82f6",
              borderRadius: "0.5rem",
              marginTop: "1rem",
              maxWidth: "100%",
              height: "auto",
              display: "block",
              minWidth: "240px",
              minHeight: "80px",
            }}
          />
        </>
      )}

      {error && <p style={{ color: "#ef4444", marginTop: "1rem", fontSize: "0.875rem" }}>{error}</p>}

      {barcodeResult && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "2px dashed #10b981",
            borderRadius: "0.5rem",
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            fontSize: "1rem",
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          ✅ Code scanné : {barcodeResult}
        </div>
      )}
    </div>
  );
}