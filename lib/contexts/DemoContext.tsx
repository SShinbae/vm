/**
 * Demo Mode Context
 *
 * Manages demo mode state across the application.
 * When demo mode is active, all API calls are intercepted and return mock data.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEMO_MODE_KEY = "app_demo_mode";

interface DemoContextType {
  isDemoMode: boolean;
  enableDemoMode: () => Promise<void>;
  disableDemoMode: () => Promise<void>;
  toggleDemoMode: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load demo mode state on mount
  useEffect(() => {
    loadDemoModeState();
  }, []);

  const loadDemoModeState = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEMO_MODE_KEY);
      if (stored !== null) {
        setIsDemoMode(JSON.parse(stored));
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error loading demo mode state:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const enableDemoMode = async () => {
    try {
      setIsDemoMode(true);
      await AsyncStorage.setItem(DEMO_MODE_KEY, JSON.stringify(true));
      if (__DEV__) {
        console.log("Demo mode enabled");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error enabling demo mode:", error);
      }
    }
  };

  const disableDemoMode = async () => {
    try {
      setIsDemoMode(false);
      await AsyncStorage.setItem(DEMO_MODE_KEY, JSON.stringify(false));
      if (__DEV__) {
        console.log("Demo mode disabled");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error disabling demo mode:", error);
      }
    }
  };

  const toggleDemoMode = async () => {
    if (isDemoMode) {
      await disableDemoMode();
    } else {
      await enableDemoMode();
    }
  };

  // IMPORTANT: Never return null from a Provider - it breaks the React tree
  // and causes immediate crash in production builds (before ErrorBoundary can catch)
  // Instead, provide default values while loading
  return (
    <DemoContext.Provider
      value={{
        isDemoMode: isLoading ? false : isDemoMode,
        enableDemoMode,
        disableDemoMode,
        toggleDemoMode,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoProvider");
  }
  return context;
}

// Hook to check if demo mode is available (web only)
export function useDemoModeAvailable() {
  return Platform.OS === "web";
}
