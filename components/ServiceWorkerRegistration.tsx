'use client';

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('Registering Service Worker...');
      
      // Délai pour éviter les conflits de chargement
      const timer = setTimeout(() => {
        navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        .then((registration) => {
          console.log('SW registered successfully:', registration);
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            console.log('SW update found');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New SW installed, reload to activate');
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.error('SW registration failed:', registrationError);
        });
      }, 1000);

      // Écouter les messages du SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from SW:', event.data);
      });

      // Écouter les erreurs du SW
      navigator.serviceWorker.addEventListener('error', (event) => {
        console.error('SW error:', event);
      });

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
} 