import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface ResponsiveLayout {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  screenWidth: number;
  screenHeight: number;
  columns: number;
  contentPadding: number;
  maxContentWidth: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const isWeb = Platform.OS === 'web';

  // Responsive breakpoints
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  // Dynamic columns based on screen size
  let columns = 1;
  if (isTablet) columns = 2;
  if (isDesktop && screenWidth >= 1440) columns = 3;
  else if (isDesktop) columns = 2;

  // Dynamic padding
  const contentPadding = isMobile ? 16 : isTablet ? 24 : 32;

  // Max content width for better readability on large screens
  const maxContentWidth = isDesktop ? 1200 : screenWidth;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    screenWidth,
    screenHeight,
    columns,
    contentPadding,
    maxContentWidth,
  };
}