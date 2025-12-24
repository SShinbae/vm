import { supabase } from "../../services/supabaseClient";

/**
 * Test function to verify Supabase connection and environment variables
 */
export const testSupabaseConnection = async () => {
  try {
    console.log("🧪 Testing Supabase connection...");

    // Test 1: Check if client is initialized
    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }
    console.log("✅ Supabase client initialized");

    // Test 2: Test database connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database connection error:", error.message);
      return false;
    }

    console.log("✅ Database connection successful");

    // Test 3: Test auth connection
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      console.error("❌ Auth connection error:", authError.message);
      return false;
    }

    console.log("✅ Auth connection successful");
    console.log("🎉 All Supabase tests passed!");

    return true;
  } catch (err) {
    console.error("❌ Supabase test failed:", err);
    return false;
  }
};

// Auto-run test in development
if (__DEV__) {
  testSupabaseConnection();
}
