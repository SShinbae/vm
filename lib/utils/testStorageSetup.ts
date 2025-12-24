import { supabase } from "../../services/supabaseClient";
import { ApiResponse } from "../../types";

export interface StorageTestResult {
  bucketExists: boolean;
  canUpload: boolean;
  canRead: boolean;
  schemaUpdated: boolean;
  errors: string[];
}

export class StorageSetupTester {
  /**
   * Test if the storage bucket exists and is properly configured
   */
  static async testBucketExists(): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        return { data: false, error: error.message, loading: false };
      }

      const bucketExists =
        data?.some((bucket) => bucket.id === "receipt-images") || false;

      return { data: bucketExists, error: null, loading: false };
    } catch (err) {
      console.error("Error checking bucket existence:", err);
      return {
        data: false,
        error:
          err instanceof Error ? err.message : "Failed to check bucket",
        loading: false,
      };
    }
  }

  /**
   * Test if we can upload a file to the storage bucket
   */
  static async testUploadPermissions(): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: false, error: "User not authenticated", loading: false };
      }

      // Create a test file (small base64 encoded image)
      const testFileContent =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      const testBlob = new Blob([atob(testFileContent)], { type: "image/png" });

      const testFileName = `${user.id}/test_${Date.now()}.png`;

      const { data, error } = await supabase.storage
        .from("receipt-images")
        .upload(testFileName, testBlob, {
          contentType: "image/png",
        });

      if (error) {
        return { data: false, error: error.message, loading: false };
      }

      // Clean up the test file
      await supabase.storage.from("receipt-images").remove([testFileName]);

      return { data: true, error: null, loading: false };
    } catch (err) {
      console.error("Error testing upload permissions:", err);
      return {
        data: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to test upload permissions",
        loading: false,
      };
    }
  }

  /**
   * Test if the database schema has been updated with OCR columns
   */
  static async testSchemaUpdate(): Promise<ApiResponse<boolean>> {
    try {
      // Try to select the new columns from service_logs table
      const { data, error } = await supabase
        .from("service_logs")
        .select("receipt_image_url, ocr_extracted_data, auto_filled")
        .limit(1);

      if (error) {
        // Check if the error is due to missing columns
        if (
          error.message.includes("column") &&
          error.message.includes("does not exist")
        ) {
          return {
            data: false,
            error: "OCR columns not found in service_logs table",
            loading: false,
          };
        }
        return { data: false, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (err) {
      console.error("Error testing schema update:", err);
      return {
        data: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to test schema update",
        loading: false,
      };
    }
  }

  /**
   * Run comprehensive storage setup test
   */
  static async runCompleteTest(): Promise<StorageTestResult> {
    console.log("🧪 Running storage setup tests...");

    const result: StorageTestResult = {
      bucketExists: false,
      canUpload: false,
      canRead: false,
      schemaUpdated: false,
      errors: [],
    };

    // Test 1: Check if bucket exists
    console.log("1. Testing bucket existence...");
    const bucketTest = await this.testBucketExists();
    if (bucketTest.data) {
      result.bucketExists = true;
      console.log("✅ Storage bucket exists");
    } else {
      result.errors.push(`Bucket test failed: ${bucketTest.error}`);
      console.log("❌ Storage bucket not found");
    }

    // Test 2: Check upload permissions
    console.log("2. Testing upload permissions...");
    const uploadTest = await this.testUploadPermissions();
    if (uploadTest.data) {
      result.canUpload = true;
      console.log("✅ Upload permissions working");
    } else {
      result.errors.push(`Upload test failed: ${uploadTest.error}`);
      console.log("❌ Upload permissions failed");
    }

    // Test 3: Check schema update
    console.log("3. Testing schema update...");
    const schemaTest = await this.testSchemaUpdate();
    if (schemaTest.data) {
      result.schemaUpdated = true;
      console.log("✅ Database schema updated");
    } else {
      result.errors.push(`Schema test failed: ${schemaTest.error}`);
      console.log("❌ Database schema not updated");
    }

    // Test 4: Test read permissions (if upload worked)
    if (result.canUpload) {
      console.log("4. Testing read permissions...");
      try {
        const { data } = await supabase.storage
          .from("receipt-images")
          .list("", { limit: 1 });

        if (data !== null) {
          result.canRead = true;
          console.log("✅ Read permissions working");
        }
      } catch (err) {
        result.errors.push(`Read test failed: ${err}`);
        console.log("❌ Read permissions failed");
      }
    }

    // Summary
    const passedTests = [
      result.bucketExists,
      result.canUpload,
      result.canRead,
      result.schemaUpdated,
    ].filter(Boolean).length;
    const totalTests = 4;

    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log(
        "🎉 All storage setup tests passed! OCR feature is ready to use.",
      );
    } else {
      console.log(
        "⚠️  Some tests failed. Check the setup_database.md file for instructions.",
      );
      console.log("Errors:", result.errors);
    }

    return result;
  }

  /**
   * Get setup instructions based on test results
   */
  static getSetupInstructions(testResult: StorageTestResult): string {
    const instructions: string[] = [];

    if (!testResult.bucketExists) {
      instructions.push(
        '1. Create the "receipt-images" storage bucket in Supabase dashboard',
      );
      instructions.push("   - Go to Storage > Create bucket");
      instructions.push("   - Name: receipt-images");
      instructions.push("   - Public: enabled");
      instructions.push("   - File size limit: 10MB");
    }

    if (!testResult.canUpload || !testResult.canRead) {
      instructions.push(
        "2. Set up Row Level Security (RLS) policies for storage",
      );
      instructions.push("   - Run the SQL commands in setup_database.md");
      instructions.push("   - Ensure user-based access policies are created");
    }

    if (!testResult.schemaUpdated) {
      instructions.push("3. Update the service_logs table schema");
      instructions.push(
        "   - Run the ALTER TABLE commands in setup_database.md",
      );
      instructions.push(
        "   - Add: receipt_image_url, ocr_extracted_data, auto_filled columns",
      );
    }

    if (instructions.length === 0) {
      return "✅ Storage setup is complete! OCR feature is ready to use.";
    }

    return "Setup Instructions:\n\n" + instructions.join("\n");
  }
}
