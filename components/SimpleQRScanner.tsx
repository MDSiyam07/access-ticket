'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface SimpleQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({
  onScanSuccess,
  onScanError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerId = 'hybrid-qr-scanner';

  // Memoize callbacks pour éviter qu'ils changent à chaque render
  const memoizedOnScanSuccess = useCallback((decodedText: string) => {
    onScanSuccess(decodedText);
  }, [onScanSuccess]);

  const memoizedOnScanError = useCallback((error: string) => {
    if (onScanError) onScanError(error);
    console.log("Erreur de scan :", error);
  }, [onScanError]);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("L'accès à la caméra est non supporté.");
      return;
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      aspectRatio: 1.0,
    };

    scannerRef.current = new Html5QrcodeScanner(scannerId, config, false);

    scannerRef.current.render(
      memoizedOnScanSuccess,
      memoizedOnScanError
    );

    return () => {
      scannerRef.current?.clear().catch((err) => {
        console.warn("Erreur lors de l'arrêt du scanner :", err);
      });
    };
  }, [memoizedOnScanSuccess, memoizedOnScanError]);

  return (
    <div>
      <div id={scannerId} />
      {errorMessage && (
        <p className="text-red-500 mt-2 text-sm">{errorMessage}</p>
      )}
    </div>
  );
};

export default SimpleQRScanner;