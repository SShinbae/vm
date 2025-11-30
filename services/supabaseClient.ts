import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { Database } from "../types/database";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey || "";

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
  } else {
    // In production, log a warning but don't crash
    console.warn("Supabase configuration missing. Some features may not work.");
  }
}

// Provide fallback values to prevent crashes (client will fail gracefully on API calls)
const safeSupabaseUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeSupabaseKey = supabaseKey || "placeholder-key";

// Use AsyncStorage for mobile, localStorage for web
const storage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) => {
          if (typeof window !== "undefined") {
            return window.localStorage.getItem(key);
          }
          return null;
        },
        setItem: async (key: string, value: string) => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value);
          }
        },
        removeItem: async (key: string) => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
          }
        },
      }
    : AsyncStorage;

export const supabase = createClient<Database>(safeSupabaseUrl, safeSupabaseKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

export default supabase;
