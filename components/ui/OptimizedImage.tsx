/**
 * Optimized Image Component
 *
 * Implements Chrome Performance best practices for image loading:
 * - Progressive image loading with placeholders
 * - Lazy loading for off-screen images
 * - Proper aspect ratio to prevent layout shifts
 * - Responsive images with appropriate sizes
 * - Blur-up technique for better perceived performance
 */

import { Image, ImageProps } from "expo-image";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  ActivityIndicator,
} from "react-native";

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  /** Image source URL */
  source: string | { uri: string } | number;
  /** Aspect ratio to prevent layout shift (e.g., 16/9, 4/3, 1) */
  aspectRatio?: number;
  /** Priority for loading (high for above-fold images) */
  priority?: "high" | "normal" | "low";
  /** Show loading indicator while image loads */
  showLoader?: boolean;
  /** Placeholder color while loading */
  placeholderColor?: string;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Enable blur-up effect */
  blurUpEnabled?: boolean;
  /** Fallback component if image fails to load */
  fallback?: React.ReactNode;
}

/**
 * Generate a tiny placeholder for blur-up effect
 * This creates a better perceived performance
 */
const generatePlaceholder = (color: string = "#E5E7EB") => {
  // Return a tiny 1x1 pixel data URI with the placeholder color
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;
};

export function OptimizedImage({
  source,
  aspectRatio,
  priority = "normal",
  showLoader = true,
  placeholderColor = "#E5E7EB",
  containerStyle,
  blurUpEnabled = true,
  fallback,
  style,
  ...imageProps
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Normalize source to uri format
  const imageSource = typeof source === "string" ? { uri: source } : source;
  const isRemoteImage = typeof imageSource === "object" && "uri" in imageSource;

  // Determine if image should be lazy loaded
  const shouldLazyLoad = priority === "low" && Platform.OS === "web";

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Container style with aspect ratio to prevent layout shift
  const computedContainerStyle: ViewStyle = {
    ...styles.container,
    ...(aspectRatio ? { aspectRatio } : {}),
    backgroundColor: placeholderColor,
    ...containerStyle,
  };

  // If error occurred and fallback is provided, show fallback
  if (hasError && fallback) {
    return <View style={computedContainerStyle}>{fallback}</View>;
  }

  // If error occurred and no fallback, show placeholder
  if (hasError) {
    return (
      <View style={[computedContainerStyle, styles.errorContainer]}>
        <View style={styles.errorPlaceholder} />
      </View>
    );
  }

  return (
    <View style={computedContainerStyle}>
      <Image
        source={imageSource}
        style={[styles.image, style]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoadEnd}
        onError={handleError}
        // Progressive loading options
        priority={priority}
        placeholder={
          blurUpEnabled && isRemoteImage
            ? generatePlaceholder(placeholderColor)
            : undefined
        }
        placeholderContentFit="cover"
        transition={200} // Smooth fade-in transition
        // Caching strategy
        cachePolicy="memory-disk"
        // Lazy loading for web
        {...(shouldLazyLoad && Platform.OS === "web"
          ? { loading: "lazy" as any }
          : {})}
        {...imageProps}
      />

      {/* Loading indicator */}
      {showLoader && isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#517c89" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorPlaceholder: {
    width: "50%",
    height: "50%",
    backgroundColor: "#D1D5DB",
    borderRadius: 8,
  },
});

/**
 * Preload images for better performance
 * Call this for critical images that will be shown soon
 */
export async function preloadImages(uris: string[]): Promise<void> {
  if (Platform.OS === "web") {
    // For web, use link preload hints
    uris.forEach((uri) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = uri;
      document.head.appendChild(link);
    });
  } else {
    // For mobile, use expo-image prefetch
    await Promise.all(uris.map((uri) => Image.prefetch(uri)));
  }
}
