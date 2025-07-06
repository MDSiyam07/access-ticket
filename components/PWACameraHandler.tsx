'use client';
import { useEffect, useState } from 'react';

export const PWACameraHandler = ({ children }: { children: React.ReactNode }) => {
  const [isPWAiOS, setIsPWAiOS] = useState(false);
  const [showSafariRedirect, setShowSafariRedirect] = useState(false);

  useEffect(() => {
    // Détecter si on est dans une PWA iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = isStandalone && isIOS;
    
    setIsPWAiOS(isPWA);
    
    // Test automatique de la caméra si PWA iOS
    if (isPWA) {
      testCameraAccess();
    }
  }, []);

  const testCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Si on arrive ici, la caméra fonctionne
      stream.getTracks().forEach(track => track.stop());
      console.log('Camera OK in PWA');
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('Camera failed in PWA, need Safari redirect');
      setShowSafariRedirect(true);
    }
  };

  const redirectToSafari = () => {
    // Construire l'URL avec un paramètre pour indiquer qu'on vient de la PWA
    const currentUrl = window.location.href;
    const urlWithParam = new URL(currentUrl);
    urlWithParam.searchParams.set('fromPWA', 'true');
    
    // Rediriger vers Safari
    window.location.href = urlWithParam.toString();
  };

  const closeSafariRedirect = () => {
    setShowSafariRedirect(false);
  };

  // Si on est dans une PWA iOS et que la caméra ne fonctionne pas
  if (isPWAiOS && showSafariRedirect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-xl font-bold mb-4">Caméra non disponible</h2>
            <p className="text-gray-600 mb-6">
              Pour utiliser la caméra, vous devez ouvrir cette page dans Safari. 
              Les PWA iOS ont des restrictions sur l&apos;accès à la caméra.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={redirectToSafari}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
              >
                Ouvrir dans Safari
              </button>
              
              <button
                onClick={closeSafariRedirect}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded"
              >
                Continuer sans caméra
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Instructions :</p>
              <p>1. Appuyez sur &quot;Ouvrir dans Safari&quot;</p>
              <p>2. Utilisez la fonction de scan</p>
              <p>3. Revenez à l&apos;app si nécessaire</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};