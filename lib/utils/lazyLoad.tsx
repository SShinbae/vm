/**
 * Code Splitting and Lazy Loading Utilities
 *
 * Implements lazy loading for components to reduce initial bundle size
 * Based on Chrome Performance best practices for document latency
 */

import React, { ComponentType, LazyExoticComponent, Suspense } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

/**
 * Default loading component shown while lazy component loads
 */
export function DefaultLoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#517c89" />
    </View>
  );
}

/**
 * Create a lazy-loaded component with automatic Suspense wrapper
 *
 * @param importFunc - Function that returns a dynamic import
 * @param fallback - Optional custom loading component
 *
 * @example
 * const LazyChart = lazyLoad(() => import('./Chart'));
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <DefaultLoadingFallback />,
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFunc);

  const LazyLoadWrapper = (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyLoadWrapper.displayName = "LazyLoadWrapper";

  return LazyLoadWrapper;
}

/**
 * Preload a lazy component to improve perceived performance
 * Call this when you know the component will be needed soon
 *
 * @example
 * preloadComponent(() => import('./Chart'));
 */
export function preloadComponent<T>(
  importFunc: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  return importFunc();
}

/**
 * Higher-order component to add lazy loading to any component
 *
 * @example
 * const LazyChart = withLazyLoad(Chart);
 */
export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
): ComponentType<P> {
  const WithLazyLoadWrapper = (props: P) => (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );

  WithLazyLoadWrapper.displayName = `WithLazyLoad(${Component.displayName || Component.name || "Component"})`;

  return WithLazyLoadWrapper;
}

/**
 * Intersection Observer-based lazy loader for React Native Web
 * Only loads component when it's about to enter the viewport
 *
 * Note: This only works on web platform
 */
export function LazyOnView({
  children,
  threshold = 0.1,
  rootMargin = "50px",
}: {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<View>(null);

  React.useEffect(() => {
    // Only run on web
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true); // Always show on native
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    const current = containerRef.current;
    if (current) {
      // @ts-ignore - Web-specific API
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  if (!isVisible) {
    return (
      <View ref={containerRef} style={styles.placeholderContainer}>
        <DefaultLoadingFallback />
      </View>
    );
  }

  return <View ref={containerRef}>{children}</View>;
}

/**
 * Route-based code splitting helper
 * Use this to lazy load entire screens/routes
 *
 * @example
 * export const AnalyticsScreen = lazyRoute(() => import('./screens/AnalyticsScreen'));
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

/**
 * Chunk preloader - preload multiple lazy chunks
 * Useful for preloading related components
 *
 * @example
 * preloadChunks([
 *   () => import('./Chart'),
 *   () => import('./Table'),
 * ]);
 */
export async function preloadChunks(
  importFuncs: (() => Promise<any>)[],
): Promise<void> {
  await Promise.all(importFuncs.map((fn) => fn()));
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  placeholderContainer: {
    minHeight: 100,
  },
});
