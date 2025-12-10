import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, useColorScheme as useNativeColorScheme } from "react-native";
import { UnistylesRuntime } from "react-native-unistyles";

export type ThemeMode = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = "@theme_mode";

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Determine the actual color scheme to use
  const colorScheme: ColorScheme =
    themeMode === "system"
      ? (systemColorScheme ?? "light")
      : themeMode === "dark"
        ? "dark"
        : "light";

  // Sync unistyles theme with color scheme
  useEffect(() => {
    UnistylesRuntime.setTheme(colorScheme);
  }, [colorScheme]);

  // Handle hydration for web
  useEffect(() => {
    if (Platform.OS === "web") {
      setHasHydrated(true);
    } else {
      setHasHydrated(true);
    }
  }, []);

  // Load saved theme preference on app start
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedMode &&
          (savedMode === "system" ||
            savedMode === "light" ||
            savedMode === "dark")
        ) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        if (__DEV__) {
          console.error("Error loading theme mode:", error);
        }
        // Set default theme instead of crashing
        setThemeModeState("system");
      } finally {
        setIsLoading(false);
      }
    };

    if (hasHydrated) {
      loadThemeMode();
    }
  }, [hasHydrated]);

  // Apply theme to document root on web
  useEffect(() => {
    if (
      Platform.OS === "web" &&
      typeof document !== "undefined" &&
      hasHydrated
    ) {
      const root = document.documentElement;

      // Remove existing theme classes
      root.classList.remove("light", "dark");

      // Add current theme class
      root.classList.add(colorScheme);

      // Set CSS custom properties for theme colors
      const isDark = colorScheme === "dark";
      root.style.setProperty(
        "--background-color",
        isDark ? "#1e292e" : "#FFFFFF", // Blue Bayoux 950 for dark
      );
      root.style.setProperty(
        "--text-color",
        isDark ? "#f3f8f8" : "#1e292e", // Blue Bayoux 50/950
      );

      // Also update the body background for consistency
      document.body.style.backgroundColor = isDark ? "#1e292e" : "#FFFFFF";
      document.body.style.color = isDark ? "#f3f8f8" : "#1e292e";

      // Debug log for web
      if (__DEV__) {
        console.log("Theme applied to web:", {
          themeMode,
          colorScheme,
          isDark,
        });
      }
    }
  }, [colorScheme, themeMode, hasHydrated]);

  // Function to update theme mode and persist it
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      if (__DEV__) {
        console.log("Setting theme mode:", mode);
      }
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      if (__DEV__) {
        console.error("Error saving theme mode:", error);
      }
      // Continue with theme change even if save fails
    }
  };

  const value = {
    themeMode,
    colorScheme,
    setThemeMode,
    isLoading: isLoading || !hasHydrated,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Custom hook to replace the native useColorScheme
export function useColorScheme(): ColorScheme | null {
  const { colorScheme, isLoading } = useTheme();

  if (isLoading) {
    return null;
  }

  return colorScheme;
}
