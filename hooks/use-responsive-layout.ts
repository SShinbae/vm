import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";

interface ResponsiveLayout {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isWeb: boolean;
  screenWidth: number;
  screenHeight: number;
  columns: number;
  contentPadding: number;
  maxContentWidth: number;
  gridGutter: number;
  gridColumns: number;
  useDesktopTypography: boolean;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const isWeb = Platform.OS === "web";

  // Check if it's a mobile device on web (not desktop browser)
  const isMobileDevice =
    isWeb &&
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // Responsive breakpoints
  // On mobile web, always use mobile layout regardless of screen size
  const isMobile = isMobileDevice || screenWidth < 768;
  const isTablet = !isMobileDevice && screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = !isMobileDevice && screenWidth >= 1024;
  const isLargeDesktop = !isMobileDevice && screenWidth >= 1440;

  // Dynamic columns based on screen size
  let columns = 1;
  if (isTablet) columns = 2;
  if (isDesktop && isLargeDesktop) columns = 3;
  else if (isDesktop) columns = 2;

  // Dynamic padding - desktop gets more breathing room
  const contentPadding = isMobile ? 16 : isTablet ? 24 : 32;

  // Max content width - desktop now 1600px
  const maxContentWidth = isDesktop ? 1600 : isTablet ? 1024 : screenWidth;

  // Grid configuration
  const gridGutter = isMobile ? 12 : isTablet ? 16 : isLargeDesktop ? 24 : 20;
  const gridColumns = 12;

  // Typography selection - use desktop scale on large screens
  const useDesktopTypography = isWeb && isDesktop;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isWeb,
    screenWidth,
    screenHeight,
    columns,
    contentPadding,
    maxContentWidth,
    gridGutter,
    gridColumns,
    useDesktopTypography,
  };
}
