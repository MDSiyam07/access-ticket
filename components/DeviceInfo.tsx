'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Monitor, Globe, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  browser: string;
  userAgent: string;
}

export default function DeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isIOS = /ipad|iphone|ipod/.test(userAgent.toLowerCase());
      const isAndroid = /android/i.test(userAgent.toLowerCase());
      
             // Détecter si c'est une PWA
       const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      
      // Détecter le navigateur
      let browser = 'Inconnu';
      if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
      } else if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
      }

      setDeviceInfo({
        isMobile,
        isIOS,
        isAndroid,
        isPWA,
        isStandalone: isPWA,
        browser,
        userAgent
      });
    };

    detectDevice();
  }, []);

  if (!deviceInfo) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const getPWAStatus = () => {
    if (deviceInfo.isPWA) {
      return {
        status: 'success',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: 'App installée et active'
      };
    } else if (deviceInfo.isMobile) {
      return {
        status: 'warning',
        icon: <Download className="w-4 h-4 text-gray-500" />,
                 text: 'Installez l&apos;app pour une meilleure expérience'
      };
    } else {
      return {
        status: 'info',
        icon: <Globe className="w-4 h-4 text-blue-500" />,
        text: 'Mode navigateur web'
      };
    }
  };

  const getCameraStatus = () => {
    if (deviceInfo.isIOS) {
      return {
        status: 'warning',
        icon: <AlertCircle className="w-4 h-4 text-gray-500" />,
        text: 'iOS: Utilisez Safari et autorisez la caméra'
      };
    } else if (deviceInfo.isAndroid) {
      return {
        status: 'success',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: 'Android: Support complet de la caméra'
      };
    } else {
      return {
        status: 'info',
        icon: <Monitor className="w-4 h-4 text-blue-500" />,
        text: 'Desktop: Support standard'
      };
    }
  };

  const pwaStatus = getPWAStatus();
  const cameraStatus = getCameraStatus();

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        {deviceInfo.isMobile ? (
          <Smartphone className="w-4 h-4 mr-2" />
        ) : (
          <Monitor className="w-4 h-4 mr-2" />
        )}
        Informations appareil
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Type d&apos;appareil:</span>
          <span className="font-medium">
            {deviceInfo.isMobile 
              ? deviceInfo.isIOS 
                ? 'iPhone/iPad' 
                : 'Android'
              : 'Desktop'
            }
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Navigateur:</span>
          <span className="font-medium">{deviceInfo.browser}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">PWA:</span>
          <div className="flex items-center">
            {pwaStatus.icon}
            <span className="ml-1 text-xs">{pwaStatus.text}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Caméra:</span>
          <div className="flex items-center">
            {cameraStatus.icon}
            <span className="ml-1 text-xs">{cameraStatus.text}</span>
          </div>
        </div>
      </div>

      {deviceInfo.isMobile && !deviceInfo.isPWA && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <p className="font-medium mb-1">💡 Conseil:</p>
          <p>
                         {deviceInfo.isIOS 
               ? 'Sur iOS, utilisez Safari et installez l&apos;app sur l&apos;écran d&apos;accueil pour de meilleures permissions caméra.'
               : 'Sur Android, installez l&apos;app pour une expérience optimale et de meilleures permissions.'
             }
          </p>
        </div>
      )}
    </div>
  );
} 