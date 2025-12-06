import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    // Check if running as native app
    setIsNativeApp(Capacitor.isNativePlatform());
    
    // Check screen size
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile,
    isNativeApp,
    screenSize,
    isSmallMobile: screenSize.width < 375,
    isMediumMobile: screenSize.width >= 375 && screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024
  };
};
