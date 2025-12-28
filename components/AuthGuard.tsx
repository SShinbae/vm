import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/contexts/AuthContext";
import { router, useSegments } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// ============================================================================
// Constants
// ============================================================================

const AUTH_PAGE_TIMEOUT = 1500; // 1.5 seconds (optimized for faster transitions)
const REDIRECT_DELAY = 0; // No delay for instant navigation

const AUTH_PAGES = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
] as const;

// Pages that should redirect to login when user is not authenticated
const INVALID_AUTH_PAGES = [
  "confirmation-success",
  "email-confirmation",
] as const;

const AUTH_ROUTES = {
  LOGIN: "/(auth)/login",
  REGISTER: "/(auth)/register",
  FORGOT_PASSWORD: "/(auth)/forgot-password",
  RESET_PASSWORD: "/(auth)/reset-password",
  TABS: "/(tabs)",
} as const;

const __DEV__ = process.env.NODE_ENV === "development";

// ============================================================================
// Types
// ============================================================================

type AuthPage = (typeof AUTH_PAGES)[number];
type InvalidAuthPage = (typeof INVALID_AUTH_PAGES)[number];
type SegmentPath = string;

interface RedirectState {
  hasRedirected: boolean;
  lastAuthPageVisit: number;
  previousPath: SegmentPath | null;
}

interface AuthGuardProps {
  children: React.ReactNode;
}

interface RouteState {
  segmentPath: string;
  inAuthGroup: boolean;
  inRootIndex: boolean;
  inTabs: boolean;
  isOnAuthPage: boolean;
  isOnInvalidAuthPage: boolean;
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to detect if user was recently on an auth page
 * Helps prevent flickering during auth state transitions
 */
function useAuthPageTracking(
  isOnAuthPage: boolean,
  timeout = AUTH_PAGE_TIMEOUT,
) {
  const [lastAuthPageVisit, setLastAuthPageVisit] = useState(0);
  const [wasRecentlyOnAuthPage, setWasRecentlyOnAuthPage] = useState(false);

  useEffect(() => {
    if (isOnAuthPage) {
      setLastAuthPageVisit(Date.now());
      setWasRecentlyOnAuthPage(true);
    }
  }, [isOnAuthPage]);

  useEffect(() => {
    if (lastAuthPageVisit === 0) {
      setWasRecentlyOnAuthPage(false);
      return;
    }

    const now = Date.now();
    const timeSinceVisit = now - lastAuthPageVisit;

    if (timeSinceVisit >= timeout) {
      setWasRecentlyOnAuthPage(false);
    } else {
      const timer = setTimeout(() => {
        setWasRecentlyOnAuthPage(false);
      }, timeout - timeSinceVisit);

      return () => clearTimeout(timer);
    }
  }, [lastAuthPageVisit, timeout]);

  return wasRecentlyOnAuthPage;
}

/**
 * Hook to compute current route state
 */
function useRouteState(segments: string[]): RouteState {
  return useMemo(() => {
    const segmentPath = segments.join("/");
    const lastSegment = segments[segments.length - 1];

    const inAuthGroup = segments[0] === "(auth)";
    const inRootIndex =
      !segmentPath || segmentPath === "" || segmentPath === "index";
    const inTabs = segments[0] === "(tabs)";

    // Check if current page is an auth page
    const isOnAuthPage =
      AUTH_PAGES.includes(lastSegment as AuthPage) || inAuthGroup;

    // Check for invalid auth pages (confirmation pages without user)
    const isOnInvalidAuthPage = INVALID_AUTH_PAGES.includes(
      lastSegment as InvalidAuthPage,
    );

    return {
      segmentPath,
      inAuthGroup,
      inRootIndex,
      inTabs,
      isOnAuthPage,
      isOnInvalidAuthPage,
    };
  }, [segments]);
}

/**
 * Hook to handle navigation with error handling
 */
function useSecureNavigation() {
  const navigate = React.useCallback(
    (route: string, options?: { delay?: number }) => {
      try {
        const delay = options?.delay ?? REDIRECT_DELAY;

        if (delay > 0) {
          setTimeout(() => {
            router.replace(route as any);
          }, delay);
        } else {
          router.replace(route as any);
        }

        if (__DEV__) {
          console.log(`[AuthGuard] Navigating to: ${route}`);
        }
      } catch (error) {
        console.error("[AuthGuard] Navigation error:", error);
      }
    },
    [],
  ); // Empty deps - router.replace is stable

  return { navigate };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AuthGuard component that handles authentication routing
 * Redirects users based on authentication state and current route
 *
 * Features:
 * - Protects authenticated routes from unauthenticated access
 * - Redirects authenticated users away from auth pages
 * - Handles password recovery flow
 * - Prevents flickering during auth state changes
 *
 * @param children - Child components to render when authentication check passes
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, initialized, isPasswordRecovery } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [redirectState, setRedirectState] = useState<RedirectState>({
    hasRedirected: false,
    lastAuthPageVisit: 0,
    previousPath: null,
  });

  // Force initialization after timeout to prevent infinite loading
  const [forceInitialized, setForceInitialized] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!initialized) {
        if (__DEV__) {
          console.warn("[AuthGuard] Forcing initialization after timeout");
        }
        setForceInitialized(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [initialized]);

  const routeState = useRouteState(segments);
  const wasRecentlyOnAuthPage = useAuthPageTracking(routeState.isOnAuthPage);
  const { navigate } = useSecureNavigation();

  const {
    segmentPath,
    inAuthGroup,
    inRootIndex,
    inTabs,
    isOnAuthPage,
    isOnInvalidAuthPage,
  } = routeState;

  // ============================================================================
  // Effect: Track Previous Path
  // ============================================================================

  useEffect(() => {
    setRedirectState((prev) => ({
      ...prev,
      previousPath: segmentPath,
    }));
  }, [segmentPath]);

  // ============================================================================
  // Effect: Handle Password Recovery Redirect
  // ============================================================================

  useEffect(() => {
    if (!initialized || loading) return;
    if (!segmentPath) return; // Skip during transitions

    // Password recovery flow - redirect to reset password page
    if (
      isPasswordRecovery &&
      user &&
      segmentPath !== AUTH_ROUTES.RESET_PASSWORD
    ) {
      if (!redirectState.hasRedirected) {
        setRedirectState((prev) => ({ ...prev, hasRedirected: true }));
        navigate(AUTH_ROUTES.RESET_PASSWORD);
      }
      return;
    }
  }, [
    user,
    initialized,
    loading,
    isPasswordRecovery,
    segmentPath,
    redirectState.hasRedirected,
    navigate,
  ]);

  // ============================================================================
  // Effect: Handle Main Authentication Redirects
  // ============================================================================

  useEffect(() => {
    if (!initialized || loading) return;
    if (!segmentPath) return; // Skip during transitions
    if (isPasswordRecovery) return; // Skip during password recovery

    // IMPORTANT: Never interfere with auth pages - let them handle their own redirects
    // This prevents flickering when auth state changes during login/register attempts
    if (isOnAuthPage || wasRecentlyOnAuthPage) {
      if (__DEV__) {
        console.log(
          "[AuthGuard] On auth page or recently on auth page, not redirecting",
        );
      }
      setRedirectState((prev) => ({ ...prev, hasRedirected: false }));
      return;
    }

    // Case 1: User not authenticated but on invalid auth pages
    // This can happen after sign out when the URL doesn't update properly
    if (!user && isOnInvalidAuthPage) {
      if (!redirectState.hasRedirected) {
        if (__DEV__) {
          console.log(
            "[AuthGuard] Redirecting to login (on invalid auth page without user)",
          );
        }
        setRedirectState((prev) => ({ ...prev, hasRedirected: true }));
        navigate(AUTH_ROUTES.LOGIN);
      }
      return;
    }

    // Case 2: User not authenticated and trying to access protected routes
    if (!user && !inAuthGroup && !inRootIndex) {
      if (!redirectState.hasRedirected) {
        if (__DEV__) {
          console.log("[AuthGuard] Redirecting to login (no user)");
        }
        setRedirectState((prev) => ({ ...prev, hasRedirected: true }));
        navigate(AUTH_ROUTES.LOGIN);
      }
      return;
    }

    // Case 3: User authenticated but still on auth pages
    if (user && inAuthGroup) {
      if (!redirectState.hasRedirected) {
        if (__DEV__) {
          console.log("[AuthGuard] Redirecting to tabs (user in auth group)");
        }
        setRedirectState((prev) => ({ ...prev, hasRedirected: true }));
        navigate(AUTH_ROUTES.TABS);
      }
      return;
    }

    // Reset redirect flag when in valid state
    // Only update if actually changed to prevent unnecessary re-renders
    if (redirectState.hasRedirected) {
      setRedirectState((prev) => ({ ...prev, hasRedirected: false }));
    }
  }, [
    user,
    initialized,
    loading,
    isPasswordRecovery,
    segmentPath,
    inAuthGroup,
    inRootIndex,
    isOnAuthPage,
    isOnInvalidAuthPage,
    wasRecentlyOnAuthPage,
    redirectState.hasRedirected,
    navigate,
  ]);

  // ============================================================================
  // Render Logic
  // ============================================================================

  /**
   * Show loading screen while initializing
   * But not on auth pages - they handle their own loading
   * Also skip if we were recently on auth page to prevent toast interruption
   * Force stop loading after timeout to prevent infinite loading
   */
  const shouldShowLoading = useMemo(() => {
    return (
      (!initialized || loading) &&
      !isOnAuthPage &&
      !wasRecentlyOnAuthPage &&
      !forceInitialized
    );
  }, [
    initialized,
    loading,
    isOnAuthPage,
    wasRecentlyOnAuthPage,
    forceInitialized,
  ]);

  if (shouldShowLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  /**
   * Don't render (tabs) content if user is not authenticated
   * But skip this check if we were recently on auth page (prevents flicker during login error)
   */
  if (!user && inTabs && !wasRecentlyOnAuthPage) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
