'use client';

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
  className?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isScanning,
  className = "",
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = "html5qr-code-full-region";
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (!isScanning || hasScanned) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    const scanner = new Html5QrcodeScanner(containerId, config, false);

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (!hasScanned) {
          setHasScanned(true);
          onScanSuccess(decodedText);
          scanner.clear(); // arrête le scanner après un scan
        }
      },
      (errorMessage) => {
        onScanError?.(errorMessage);
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isScanning, onScanSuccess, onScanError, hasScanned]);

  return <div id={containerId} className={className} />;
};

export default QRScanner;
