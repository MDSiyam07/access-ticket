'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface SpecialPWAScannerTestProps {
  stream?: MediaStream | null;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean;
  onScannerReady?: () => void;
  onScannerError?: (error: string) => void;
}

const SpecialPWAScannerTest = ({
  onScanSuccess,
  onScanError,
  isActive,
  onScannerReady,
  onScannerError,
}: SpecialPWAScannerTestProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-scanner-region';

  useEffect(() => {
    const initScanner = async () => {
      if (!isActive || scannerRef.current) return;

      try {
        const config = {
          fps: 10,
          qrbox: 250,
          videoConstraints: {
            facingMode: { ideal: 'environment' }, // 🔍 pour activer la caméra arrière
          },
        };

        scannerRef.current = new Html5Qrcode(qrRegionId);

        await scannerRef.current.start(
          { facingMode: 'environment' }, // 🔍 requis sur iOS/Safari
          config,
          onScanSuccess,
          onScanError
        );

        onScannerReady?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        onScannerError?.(err.message);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <div id={qrRegionId} className="w-full h-full" />
  );
};

export default SpecialPWAScannerTest;
