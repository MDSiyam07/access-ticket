'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  timeout?: number; // Timeout en ms pour éviter les boucles infinies
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Chargement...', 
  className = '',
  timeout = 10000 // 10 secondes par défaut
}: LoadingSpinnerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Timeout pour éviter les boucles infinies
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
      console.warn('LoadingSpinner timeout reached - possible infinite loop detected');
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [timeout]);

  // Vérification de montage pour éviter les re-renders inutiles
  useEffect(() => {
    let mounted = true;
    
    const checkVisibility = () => {
      if (mounted) {
        setIsVisible(true);
      }
    };

    // Petit délai pour s'assurer que le composant est bien monté
    const timer = setTimeout(checkVisibility, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Si le timeout est atteint, afficher un message d'erreur
  if (timeoutReached) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className={`${sizeClasses[size]} text-red-500 mb-2`}>
          ⚠️
        </div>
        <p className="text-sm text-red-600 text-center">
          Problème de chargement détecté. Veuillez rafraîchir la page.
        </p>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mb-2`} />
      {text && (
        <p className="text-sm text-gray-600 text-center">{text}</p>
      )}
    </div>
  );
} 