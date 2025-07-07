// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Camera, Square, RotateCcw, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

// const DirectCameraTest = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [error, setError] = useState<string>('');
//   const [isActive, setIsActive] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const [deviceInfo, setDeviceInfo] = useState<any>(null);

//   const startCamera = async () => {
//     try {
//       setError('');
//       setIsLoading(true);
      
//       // Configuration spécifique iOS
//       const constraints: MediaStreamConstraints = {
//         video: {
//           facingMode: 'environment',
//           width: { ideal: 1280 },
//           height: { ideal: 720 }
//         },
//         audio: false // Pas d'audio pour éviter les conflits
//       };

//       console.log('Demande accès caméra...');
//       const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
//       console.log('Stream obtenu:', mediaStream);
      
//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
        
//         // CRUCIAL: Attendre que la vidéo soit prête
//         videoRef.current.onloadedmetadata = () => {
//           console.log('Métadonnées vidéo chargées');
//           if (videoRef.current) {
//             videoRef.current.play().then(() => {
//               console.log('Vidéo en cours de lecture');
//               setIsActive(true);
//               setIsLoading(false);
//             }).catch(err => {
//               console.error('Erreur lecture vidéo:', err);
//               setError(`Erreur lecture: ${err.message}`);
//               setIsLoading(false);
//             });
//           }
//         };

//         // Gérer les erreurs vidéo
//         videoRef.current.onerror = (err) => {
//           console.error('Erreur vidéo:', err);
//           setError('Erreur de lecture vidéo');
//           setIsLoading(false);
//         };
//       }
      
//       setStream(mediaStream);
      
//       // Récupérer les informations de l'appareil
//       const tracks = mediaStream.getVideoTracks();
//       if (tracks.length > 0) {
//         const track = tracks[0];
//         const capabilities = track.getCapabilities();
//         const settings = track.getSettings();
//         setDeviceInfo({
//           capabilities,
//           settings,
//           trackId: track.id,
//           label: track.label
//         });
//       }
      
//       // Surveiller l'état des tracks
//       mediaStream.getVideoTracks().forEach(track => {
//         console.log('Track state:', track.readyState);
//         track.onended = () => {
//           console.log('Track ended');
//           setIsActive(false);
//         };
//       });

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error('Erreur caméra:', error);
//       setError(`Erreur: ${error.name} - ${error.message}`);
//       setIsLoading(false);
//     }
//   };

//   const stopCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach(track => {
//         track.stop();
//         console.log('Track stopped');
//       });
//       setStream(null);
//       setIsActive(false);
//     }
    
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//   };

//   const resetCamera = () => {
//     stopCamera();
//     setError('');
//     setDeviceInfo(null);
//     setTimeout(() => {
//       startCamera();
//     }, 500);
//   };

//   // Nettoyage au démontage
//   useEffect(() => {
//     return () => {
//       stopCamera();
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold mb-2">Test Caméra Direct</h1>
//         <p className="text-muted-foreground">
//           Testez l&apos;accès direct à la caméra de votre appareil
//         </p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Camera className="h-5 w-5" />
//             Contrôles de la caméra
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
//               <AlertTriangle className="h-4 w-4" />
//               {error}
//             </div>
//           )}

//           <div className="flex gap-2">
//             {!isActive ? (
//               <Button
//                 onClick={startCamera}
//                 disabled={isLoading}
//                 className="flex-1"
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                     Démarrage...
//                   </>
//                 ) : (
//                   <>
//                     <Camera className="h-4 w-4 mr-2" />
//                     Démarrer la caméra
//                   </>
//                 )}
//               </Button>
//             ) : (
//               <Button
//                 onClick={stopCamera}
//                 variant="destructive"
//                 className="flex-1"
//               >
//                 <Square className="h-4 w-4 mr-2" />
//                 Arrêter la caméra
//               </Button>
//             )}
            
//             {isActive && (
//               <Button
//                 onClick={resetCamera}
//                 variant="outline"
//                 size="sm"
//               >
//                 <RotateCcw className="h-4 w-4 mr-2" />
//                 Reset
//               </Button>
//             )}
//           </div>

//           <div className="flex items-center gap-2">
//             <Badge variant={isActive ? "default" : "secondary"}>
//               {isActive ? (
//                 <>
//                   <CheckCircle className="h-3 w-3 mr-1" />
//                   Actif
//                 </>
//               ) : (
//                 <>
//                   <Square className="h-3 w-3 mr-1" />
//                   Inactif
//                 </>
//               )}
//             </Badge>
            
//             <Badge variant="outline">
//               Stream: {stream ? 'Présent' : 'Absent'}
//             </Badge>
            
//             <Badge variant="outline">
//               Tracks: {stream ? stream.getVideoTracks().length : 0}
//             </Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Élément vidéo */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Vidéo en direct</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="relative bg-black rounded-lg overflow-hidden">
//             <video
//               ref={videoRef}
//               className="w-full h-auto"
//               playsInline // CRUCIAL pour iOS
//               muted // CRUCIAL pour iOS
//               autoPlay={false} // On démarre manuellement
//               style={{ 
//                 maxHeight: '400px',
//                 objectFit: 'cover'
//               }}
//             />
            
//             {isActive && (
//               <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
//                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
//                 Caméra active
//               </div>
//             )}
            
//             {isLoading && (
//               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                 <div className="text-white text-center">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
//                   <p>Initialisation de la caméra...</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Informations de debug */}
//       {deviceInfo && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Settings className="h-5 w-5" />
//               Informations de l&apos;appareil
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2 text-sm">
//               <div>
//                 <strong>Track ID:</strong> {deviceInfo.trackId}
//               </div>
//               <div>
//                 <strong>Label:</strong> {deviceInfo.label || 'Non disponible'}
//               </div>
//               <div>
//                 <strong>Résolution:</strong> {deviceInfo.settings.width} x {deviceInfo.settings.height}
//               </div>
//               <div>
//                 <strong>FPS:</strong> {deviceInfo.settings.frameRate || 'Non disponible'}
//               </div>
//               {deviceInfo.capabilities && (
//                 <div>
//                   <strong>Capacités:</strong>
//                   <ul className="list-disc list-inside mt-1 ml-4">
//                     {deviceInfo.capabilities.facingMode && (
//                       <li>Modes: {deviceInfo.capabilities.facingMode.join(', ')}</li>
//                     )}
//                     {deviceInfo.capabilities.width && (
//                       <li>Largeur: {deviceInfo.capabilities.width.min} - {deviceInfo.capabilities.width.max}</li>
//                     )}
//                     {deviceInfo.capabilities.height && (
//                       <li>Hauteur: {deviceInfo.capabilities.height.min} - {deviceInfo.capabilities.height.max}</li>
//                     )}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Instructions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Instructions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-2 text-sm text-muted-foreground">
//             <p>• Cette page teste l&apos;accès direct à la caméra de votre appareil</p>
//             <p>• Cliquez sur &quot;Démarrer la caméra&quot; pour commencer le test</p>
//             <p>• La caméra arrière sera utilisée par défaut (facingMode: environment)</p>
//             <p>• En cas de problème, utilisez le bouton &quot;Reset&quot; pour redémarrer</p>
//             <p>• Les informations de l&apos;appareil s&apos;affichent une fois la caméra active</p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default function CameraTestPage() {
//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
//       <DirectCameraTest />
//     </div>
//   );
// } 
'use client';

import Scanner from '@/components/Tmp/Scanner';

export default function CameraTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Scanner />
    </div>
  );
} 