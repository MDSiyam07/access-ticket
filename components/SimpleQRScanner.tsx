'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface SimpleQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({
  onScanSuccess,
  onScanError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannedText, setScannedText] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    };

    const scanner = new Html5QrcodeScanner('qr-reader', config, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        setScannedText(decodedText);
        onScanSuccess(decodedText);
      },
      (error) => {
        console.warn('QR Scan Error:', error);
        onScanError?.(error);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error('Clear scanner error:', err));
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%' }} />
      {scannedText && (
        <div className="mt-2 text-green-600 font-mono text-sm">
          ✅ Code scanné : {scannedText}
        </div>
      )}
    </div>
  );
};

export default SimpleQRScanner;