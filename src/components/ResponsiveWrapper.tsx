import React from 'react';
import { useMobile } from '../hooks/useMobile';

interface ResponsiveWrapperProps {
  mobileComponent: React.ReactElement;
  desktopComponent: React.ReactElement;
}

const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  mobileComponent,
  desktopComponent,
}) => {
  const { isMobile, isNativeApp } = useMobile();

  // Always use mobile UI for native apps
  // Use mobile UI for screens smaller than 768px
  const useMobileUI = isNativeApp || isMobile || window.innerWidth < 768;

  if (useMobileUI) {
    return mobileComponent;
  }

  return desktopComponent;
};

export default ResponsiveWrapper;
