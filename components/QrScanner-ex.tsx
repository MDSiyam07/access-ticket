'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

const QrScanner = ({ onScan }: { onScan: (result: string) => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');

        // Essaye de trouver la caméra arrière (device label contient "back" ou "rear")
        const backCamera = videoDevices.find((d) =>
          /back|rear/i.test(d.label)
        ) || videoDevices[0]; // fallback : première caméra

        if (!backCamera) {
          setError('Aucune caméra disponible.');
          return;
        }

        cameraIdRef.current = backCamera.deviceId;
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { deviceId: { exact: backCamera.deviceId } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop();
          },
          (err) => {
            console.error(err);
          }
        );
      } catch (err) {
        setError('Erreur lors de l’accès à la caméra.');
        console.error(err);
      }
    };

    initScanner();

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div id="qr-reader" style={{ width: '100%', maxWidth: 400 }} />
      )}
    </div>
  );
};

export default QrScanner;
