// 'use client';
// import { useEffect, useRef, useState } from 'react';

// export const PWACameraWorkaround = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [error, setError] = useState<string>('');
//   const [isActive, setIsActive] = useState(false);
//   const [isPWAiOS, setIsPWAiOS] = useState(false);

//   useEffect(() => {
//     // Détecter PWA iOS
//     const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
//     const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
//     setIsPWAiOS(isStandalone && isIOS);
//   }, []);

//   const startCameraWithWorkaround = async () => {
//     try {
//       setError('');
      
//       // Configuration spéciale pour PWA iOS
//       const constraints = {
//         video: {
//           facingMode: 'environment',
//           width: { ideal: 640, max: 1280 }, // Résolution plus faible pour PWA
//           height: { ideal: 480, max: 720 },
//           frameRate: { ideal: 15, max: 30 }, // FPS plus faible
//           // Workaround spécifique PWA
//           advanced: [
//             { focusMode: "continuous" },
//             { exposureMode: "continuous" },
//             { whiteBalanceMode: "continuous" }
//           ]
//         },
//         audio: false
//       };

//       console.log('PWA iOS Camera start...');
      
//       // Workaround 1: Délai avant la demande
//       await new Promise(resolve => setTimeout(resolve, 100));
      
//       const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
//       console.log('Stream obtained in PWA');
      
//       if (videoRef.current) {
//         // Workaround 2: Configuration vidéo spéciale PWA
//         videoRef.current.srcObject = mediaStream;
//         videoRef.current.muted = true;
//         videoRef.current.playsInline = true;
//         videoRef.current.autoplay = false;
        
//         // Workaround 3: Forcer le style pour PWA
//         videoRef.current.style.width = '100%';
//         videoRef.current.style.height = 'auto';
//         videoRef.current.style.objectFit = 'cover';
        
//         // Workaround 4: Gérer manuellement la lecture
//         const playPromise = videoRef.current.play();
//         if (playPromise !== undefined) {
//           await playPromise;
//           console.log('Video playing in PWA');
//           setIsActive(true);
//         }
//       }
      
//       setStream(mediaStream);
      
//       // Workaround 5: Maintenir le stream actif
//       const keepAlive = setInterval(() => {
//         if (mediaStream.getVideoTracks().length > 0) {
//           const track = mediaStream.getVideoTracks()[0];
//           if (track.readyState === 'live') {
//             console.log('Stream still alive');
//           } else {
//             console.log('Stream died, cleaning up');
//             clearInterval(keepAlive);
//             setIsActive(false);
//           }
//         }
//       }, 1000);

//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error('PWA Camera error:', error);
//       setError(`PWA Error: ${error.name} - ${error.message}`);
      
//       // Suggestion alternative
//       if (error.name === 'NotAllowedError') {
//         setError('Caméra bloquée dans PWA. Essayez d\'ouvrir dans Safari.');
//       }
//     }
//   };

//   const stopCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach(track => {
//         track.stop();
//         console.log('PWA Track stopped');
//       });
//       setStream(null);
//       setIsActive(false);
//     }
    
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//   };

//   const openInSafari = () => {
//     // Ouvrir la même URL dans Safari
//     window.location.href = window.location.href;
//   };

//   useEffect(() => {
//     return () => {
//       stopCamera();
//     };
//   }, []);

//   return (
//     <div className="w-full max-w-md mx-auto p-4">
//       <h2 className="text-xl font-bold mb-4">
//         Scanner PWA iOS {isPWAiOS && '(Mode PWA détecté)'}
//       </h2>
      
//       {isPWAiOS && (
//         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
//           <p className="text-sm">
//             ⚠️ PWA iOS détectée. Si la caméra ne fonctionne pas, utilisez Safari.
//           </p>
//         </div>
//       )}
      
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//           <p className="text-sm">{error}</p>
//           {isPWAiOS && (
//             <button
//               onClick={openInSafari}
//               className="mt-2 text-blue-600 underline text-sm"
//             >
//               Ouvrir dans Safari
//             </button>
//           )}
//         </div>
//       )}

//       <div className="mb-4">
//         {!isActive ? (
//           <button
//             onClick={startCameraWithWorkaround}
//             className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Démarrer caméra (PWA Workaround)
//           </button>
//         ) : (
//           <button
//             onClick={stopCamera}
//             className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Arrêter la caméra
//           </button>
//         )}
//       </div>

//       {/* Élément vidéo avec configuration PWA */}
//       <div className="relative">
//         <video
//           ref={videoRef}
//           className="w-full h-auto rounded-lg border"
//           playsInline
//           muted
//           style={{ 
//             maxHeight: '400px',
//             objectFit: 'cover',
//             backgroundColor: '#000'
//           }}
//         />
        
//         {isActive && (
//           <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
//             🟢 PWA Caméra active
//           </div>
//         )}
//       </div>

//       {/* Debug info */}
//       <div className="mt-4 text-sm text-gray-600">
//         <p>PWA iOS: {isPWAiOS ? 'Oui' : 'Non'}</p>
//         <p>Status: {isActive ? 'Actif' : 'Inactif'}</p>
//         <p>Stream: {stream ? 'Présent' : 'Absent'}</p>
//       </div>
//     </div>
//   );
// };