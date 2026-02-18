import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { Database } from "../types/database";

// Safely get environment variables with error handling for production
let supabaseUrl = "";
let supabaseKey = "";

try {
  supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
  supabaseKey = Constants.expoConfig?.extra?.supabaseKey || "";
} catch (error) {
  // Silent fail in production - Constants.expoConfig might not be available
  if (__DEV__) {
    console.error("Failed to get Supabase config from Constants:", error);
  }
}

// Warn instead of throwing to prevent production crashes
if (!supabaseUrl || !supabaseKey) {
  if (__DEV__) {
    console.error(
      "Missing Supabase environment variables. Please check your app.config.js and .env file.",
    );
    console.error("Current values:", {
      supabaseUrl: supabaseUrl ? "Set" : "Missing",
      supabaseKey: supabaseKey ? "Set" : "Missing",
    });
  }
  // In production, fail silently to prevent crashes
}

// Provide fallback values to prevent crashes (client will fail gracefully on API calls)
const safeSupabaseUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeSupabaseKey = supabaseKey || "placeholder-key";

// Use AsyncStorage for mobile, localStorage for web
// IMPORTANT: Web storage must return Promise<string | null> for proper session restoration
const storage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string): Promise<string | null> => {
          if (typeof window !== "undefined") {
            try {
              const value = window.localStorage.getItem(key);
              return Promise.resolve(value);
            } catch (error) {
              if (__DEV__) {
                console.error("Error reading from localStorage:", error);
              }
              return Promise.resolve(null);
            }
          }
          return Promise.resolve(null);
        },
        setItem: async (key: string, value: string): Promise<void> => {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(key, value);
              return Promise.resolve();
            } catch (error) {
              if (__DEV__) {
                console.error("Error writing to localStorage:", error);
              }
              return Promise.resolve();
            }
          }
          return Promise.resolve();
        },
        removeItem: async (key: string): Promise<void> => {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem(key);
              return Promise.resolve();
            } catch (error) {
              if (__DEV__) {
                console.error("Error removing from localStorage:", error);
              }
              return Promise.resolve();
            }
          }
          return Promise.resolve();
        },
      }
    : AsyncStorage;

// Check if we're on a page that needs URL token detection (password reset, email confirmation)
// This prevents logout loops on normal page refreshes while still detecting auth tokens
const shouldDetectSessionInUrl = (): boolean => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;

  // Check for PKCE code (password reset, email confirmation)
  if (searchParams.has("code")) {
    return true;
  }

  // Check for hash-based tokens (older Supabase format)
  if (
    hash.includes("access_token") ||
    hash.includes("refresh_token") ||
    hash.includes("type=recovery")
  ) {
    return true;
  }

  // Check for error parameters from failed auth flows
  if (searchParams.has("error") || searchParams.has("error_description")) {
    return true;
  }

  return false;
};

// Create Supabase client with error handling to prevent production crashes
let supabase: ReturnType<typeof createClient<Database>>;

try {
  supabase = createClient<Database>(safeSupabaseUrl, safeSupabaseKey, {
    auth: {
      storage: storage,
      autoRefreshToken: true,
      persistSession: true,
      // Only detect session in URL when auth tokens are present
      // This prevents logout loops on normal page refreshes while still
      // handling password reset and email confirmation flows
      detectSessionInUrl: shouldDetectSessionInUrl(),
      // Debug mode disabled - enable temporarily if debugging auth issues
      // debug: __DEV__,
      // Increase storage key to avoid conflicts
      storageKey: "sb-auth-token",
      // Flow type for better compatibility
      flowType: "pkce",
    },
  });
} catch (error) {
  // If client creation fails, create a minimal client that won't crash
  if (__DEV__) {
    console.error("Failed to create Supabase client:", error);
  }
  // Create with placeholder values - API calls will fail gracefully
  supabase = createClient<Database>(
    "https://placeholder.supabase.co",
    "placeholder-key",
    {
      auth: {
        storage: storage,
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export { supabase };
export default supabase;
