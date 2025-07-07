'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';

export default function Scanner() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [result, setResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  // Fonction pour vérifier les permissions caméra
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.log('Permission caméra refusée:', error);
      setError('Permission caméra requise pour scanner les QR codes');
      return false;
    }
  };

  // Fonction sécurisée pour arrêter le scanner
  const safeStop = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.pause();
        }
        // Attendre un peu avant de nettoyer
        setTimeout(() => {
          try {
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
          } catch (clearError) {
            console.log('Erreur lors du nettoyage:', clearError);
          }
        }, 100);
      }
    } catch (error) {
      console.log('Erreur lors de l\'arrêt:', error);
    } finally {
      // Nettoyer manuellement le DOM si nécessaire
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.innerHTML = '';
      }
      setIsScanning(false);
    }
  };

  // Fonction pour démarrer le scanner
  const startScanner = async () => {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
      // Configuration optimisée pour iOS PWA
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Paramètres spécifiques pour iOS
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        },
        // Forcer l'utilisation de la caméra arrière
        videoConstraints: {
          facingMode: "environment"
        },
        // Réduire la verbosité pour éviter les logs excessifs
        verbose: false
      };

      const scanner = new Html5QrcodeScanner('reader', config, false);
      scannerRef.current = scanner;

      const success = (result: string) => {
        setResult(result);
        setIsScanning(false);
        // Arrêter le scanner de manière sécurisée
        safeStop();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorCallback = (err: any) => {
        // Ignorer les erreurs de "no QR code found" qui sont normales
        if (!err.toString().includes('No QR code found')) {
          console.error('Erreur scanner:', err);
          setError('Erreur lors du scan: ' + err.toString());
        }
      };

      scanner.render(success, errorCallback);
      setIsScanning(true);
      setError('');
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
      setError('Impossible de démarrer le scanner');
    }
  };

  useEffect(() => {
    // Démarrer automatiquement le scanner au montage
    startScanner();

    // Nettoyage au démontage du composant
    return () => {
      safeStop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gestion des changements de visibilité (important pour PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isScanning) {
        safeStop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScanning]);

  const handleRestart = () => {
    setResult('');
    setError('');
    startScanner();
  };

  return (
    <main>
      <div id="reader"></div>
      
      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={handleRestart}>Réessayer</button>
        </div>
      )}
      
      {result && (
        <div id="result">
          <h2>QR Code scanné !</h2>
          <p>
            <a href={result} target="_blank" rel="noopener noreferrer">
              {result}
            </a>
          </p>
          <button onClick={handleRestart}>Scanner un autre QR code</button>
        </div>
      )}
      
      {isScanning && (
        <div className="scanning-info">
          <p>Scanner actif - Pointez votre caméra vers un QR code</p>
          <button onClick={safeStop}>Arrêter le scanner</button>
        </div>
      )}

      <style jsx>{`
        main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        #reader {
          width: 100%;
          max-width: 600px;
        }
        #result {
          text-align: center;
          font-size: 1.5rem;
          margin-top: 20px;
        }
        .error {
          color: red;
          text-align: center;
          margin-top: 20px;
        }
        .scanning-info {
          text-align: center;
          margin-top: 20px;
          color: #666;
        }
        button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        }
        button:hover {
          background-color: #0056b3;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          #reader {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}