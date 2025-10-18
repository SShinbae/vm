import Constants from "expo-constants";
import { ApiResponse } from "../../types";

// Google Vision API configuration
interface GoogleVisionConfig {
  apiKey: string;
  endpoint: string;
}

interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations: Array<{
      description: string;
      boundingPoly?: any;
      confidence?: number;
    }>;
    fullTextAnnotation?: {
      text: string;
      confidence?: number;
      pages?: Array<{
        confidence?: number;
        width?: number;
        height?: number;
      }>;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

export class GoogleVisionService {
  private static config: GoogleVisionConfig = {
    apiKey: Constants.expoConfig?.extra?.googleVisionApiKey || "",
    endpoint: "https://vision.googleapis.com/v1/images:annotate",
  };

  /**
   * Initialize Google Vision service with API key
   */
  static setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  /**
   * Convert image URI to base64 string with preprocessing
   */
  private static async imageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we need to fetch the image and convert to base64
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw new Error("Failed to process image for OCR");
    }
  }

  /**
   * Validate image quality for OCR processing
   */
  private static validateImageForOCR(imageUri: string): {
    isValid: boolean;
    suggestion?: string;
  } {
    // Basic validation - in a real app, you might want to analyze the actual image
    if (
      !imageUri ||
      (!imageUri.includes("file://") &&
        !imageUri.includes("content://") &&
        !imageUri.includes("http"))
    ) {
      return { isValid: false, suggestion: "Invalid image format" };
    }

    // For now, we'll assume the image is valid
    // In the future, we could add:
    // - Image size validation
    // - Brightness/contrast analysis
    // - Text region detection
    return { isValid: true };
  }

  /**
   * Extract text with multiple detection methods for better accuracy
   */
  private static async extractTextWithMultipleMethods(
    base64Image: string,
  ): Promise<{ text: string; confidence: number }> {
    const methods = [
      {
        name: "DOCUMENT_TEXT_DETECTION",
        features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
      },
      {
        name: "TEXT_DETECTION",
        features: [{ type: "TEXT_DETECTION", maxResults: 50 }],
      },
    ];

    let bestResult = { text: "", confidence: 0 };

    for (const method of methods) {
      try {
        const requestPayload = {
          requests: [
            {
              image: { content: base64Image },
              features: method.features,
              imageContext: {
                languageHints: ["en"],
                textDetectionParams: {
                  enableTextDetectionConfidenceScore: true,
                },
              },
            },
          ],
        };

        const response = await fetch(
          `${this.config.endpoint}?key=${this.config.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload),
          },
        );

        if (!response.ok) continue;

        const result: GoogleVisionResponse = await response.json();
        if (result.responses?.[0]?.error) continue;

        const responseData = result.responses[0];
        let extractedText = "";
        let confidence = 0;

        if (
          method.name === "DOCUMENT_TEXT_DETECTION" &&
          responseData.fullTextAnnotation
        ) {
          extractedText = responseData.fullTextAnnotation.text || "";
          confidence = responseData.fullTextAnnotation.confidence || 0;
          // For pages-based confidence
          if (responseData.fullTextAnnotation.pages?.length) {
            const pageConfidences = responseData.fullTextAnnotation.pages
              .map((p) => p.confidence || 0)
              .filter((c) => c > 0);
            if (pageConfidences.length) {
              confidence =
                pageConfidences.reduce((a, b) => a + b) /
                pageConfidences.length;
            }
          }
        } else if (responseData.textAnnotations?.length) {
          extractedText = responseData.textAnnotations[0].description || "";
          confidence = responseData.textAnnotations[0].confidence || 0;
          // Calculate average confidence from all text annotations
          const confidenceScores = responseData.textAnnotations
            .map((ta) => ta.confidence || 0)
            .filter((c) => c > 0);
          if (confidenceScores.length) {
            confidence =
              confidenceScores.reduce((a, b) => a + b) /
              confidenceScores.length;
          }
        }

        // Prefer results with higher confidence and longer text
        const score = confidence * 0.7 + (extractedText.length / 1000) * 0.3;
        if (
          score >
          bestResult.confidence * 0.7 + (bestResult.text.length / 1000) * 0.3
        ) {
          bestResult = { text: extractedText, confidence: confidence * 100 };
        }
      } catch (error) {
        console.log(`Method ${method.name} failed:`, error);
        continue;
      }
    }

    return bestResult;
  }

  /**
   * Extract text from image using Google Vision API
   */
  static async extractTextFromImage(
    imageUri: string,
  ): Promise<ApiResponse<string>> {
    try {
      // Validate API key
      if (!this.config.apiKey) {
        return {
          data: null,
          error:
            "Google Vision API key not configured. Please set GOOGLE_VISION_API_KEY in your environment variables.",
          loading: false,
        };
      }

      // Validate image URI
      if (!imageUri || typeof imageUri !== "string") {
        return {
          data: null,
          error: "Invalid image URI provided",
          loading: false,
        };
      }

      // Validate image quality
      const validation = this.validateImageForOCR(imageUri);
      if (!validation.isValid) {
        return {
          data: null,
          error:
            validation.suggestion || "Image quality is not suitable for OCR",
          loading: false,
        };
      }

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);

      // Use enhanced multi-method text extraction
      const extractionResult =
        await this.extractTextWithMultipleMethods(base64Image);

      if (!extractionResult.text || extractionResult.text.trim().length === 0) {
        return {
          data: null,
          error:
            "No text was detected in the image. Please ensure the receipt is clearly visible and try again.",
          loading: false,
        };
      }

      // Log confidence for debugging
      console.log(
        `OCR completed with ${extractionResult.confidence.toFixed(1)}% confidence`,
      );
      console.log(
        `Extracted text length: ${extractionResult.text.length} characters`,
      );

      return {
        data: extractionResult.text,
        error: null,
        loading: false,
        confidence: extractionResult.confidence,
      };
    } catch (error) {
      console.error("Error in Google Vision OCR:", error);

      // Provide specific error messages for common issues
      let errorMessage = "Failed to extract text from image";

      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("base64")) {
          errorMessage =
            "Failed to process image. Please try taking a new photo.";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        data: null,
        error: errorMessage,
        loading: false,
      };
    }
  }

  /**
   * Test Google Vision API connection
   */
  static async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      if (!this.config.apiKey) {
        return {
          data: false,
          error: "Google Vision API key not configured",
          loading: false,
        };
      }

      // Create a minimal test request
      const testPayload = {
        requests: [
          {
            image: {
              content:
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 transparent PNG
            },
            features: [
              {
                type: "TEXT_DETECTION",
                maxResults: 1,
              },
            ],
          },
        ],
      };

      const response = await fetch(
        `${this.config.endpoint}?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testPayload),
        },
      );

      if (!response.ok) {
        return {
          data: false,
          error: `API connection failed: ${response.status}`,
          loading: false,
        };
      }

      return {
        data: true,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("Error testing Google Vision API connection:", error);
      return {
        data: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
        loading: false,
      };
    }
  }

  /**
   * Get usage and quota information (if available)
   */
  static getUsageInfo() {
    return {
      apiKeyConfigured: !!this.config.apiKey,
      endpoint: this.config.endpoint,
      documentsPerMonth: 1000, // Free tier limit
      costPer1000: 1.5, // USD
      features: [
        "Text Detection",
        "Document Text Detection",
        "Handwriting Detection",
        "Multi-language Support",
      ],
    };
  }
}
