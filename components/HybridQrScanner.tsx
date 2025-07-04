'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

interface HybridQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function HybridQrScanner({ onScanSuccess }: HybridQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        if (!videoRef.current) return;

        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) throw new Error('Aucune caméra détectée');

        const cameraId = cameras[0].id;

        html5QrCodeRef.current = new Html5Qrcode('qr-reader');

        await html5QrCodeRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log('QR Code détecté :', decodedText);
    toast.success(`QR détecté : ${decodedText}`, { duration: 3000 });
            onScanSuccess(decodedText);
            setScanning(false);
            html5QrCodeRef.current?.stop();
          },
          (errorMessage) => {
            // Erreurs mineures ignorées
            console.warn('Scan error:', errorMessage);
          }
        );

        setScanning(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Erreur lors du démarrage du scanner');
        }
      }
    };

    startScanner();

    return () => {
      // Cleanup
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
        html5QrCodeRef.current.clear();
      }
      if (videoRef.current?.srcObject) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%', maxWidth: 400 }} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}