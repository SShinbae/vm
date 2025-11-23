import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { Database } from "../types/database";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your app.config.js and .env file.",
  );
}

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

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

export default supabase;
