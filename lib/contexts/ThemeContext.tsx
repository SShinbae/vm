import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useNativeColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

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
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = '@theme_mode';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Determine the actual color scheme to use
  const colorScheme: ColorScheme = themeMode === 'system'
    ? (systemColorScheme ?? 'light')
    : themeMode === 'dark'
    ? 'dark'
    : 'light';

  // Handle hydration for web
  useEffect(() => {
    if (Platform.OS === 'web') {
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
        if (savedMode && (savedMode === 'system' || savedMode === 'light' || savedMode === 'dark')) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
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
    if (Platform.OS === 'web' && typeof document !== 'undefined' && hasHydrated) {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Add current theme class
      root.classList.add(colorScheme);
      
      // Set CSS custom properties for theme colors
      const isDark = colorScheme === 'dark';
      root.style.setProperty('--background-color', isDark ? '#222831' : '#FFFFFF');
      root.style.setProperty('--text-color', isDark ? '#F9FAFB' : '#1F2937');
      
      // Also update the body background for consistency
      document.body.style.backgroundColor = isDark ? '#222831' : '#FFFFFF';
      document.body.style.color = isDark ? '#F9FAFB' : '#1F2937';
      
      // Debug log for web
      console.log('Theme applied to web:', { themeMode, colorScheme, isDark });
    }
  }, [colorScheme, themeMode, hasHydrated]);

  // Function to update theme mode and persist it
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      console.log('Setting theme mode:', mode);
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const value = {
    themeMode,
    colorScheme,
    setThemeMode,
    isLoading: isLoading || !hasHydrated,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Custom hook to replace the native useColorScheme
export function useColorScheme(): ColorScheme | null {
  const { colorScheme, isLoading } = useTheme();

  if (isLoading) {
    return null;
  }

  return colorScheme;
}