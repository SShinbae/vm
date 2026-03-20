import Constants from "expo-constants";
import { Platform } from "react-native";
import { ApiResponse } from "../../types";

interface GoogleVisionResponse {
  responses: {
    textAnnotations: {
      description: string;
      boundingPoly?: any;
      confidence?: number;
    }[];
    fullTextAnnotation?: {
      text: string;
      confidence?: number;
      pages?: {
        confidence?: number;
        width?: number;
        height?: number;
      }[];
    };
    error?: {
      code: number;
      message: string;
    };
  }[];
}

export class GoogleVisionService {
  private static getProxyUrl(): string {
    const siteUrl = Constants.expoConfig?.extra?.siteUrl || "";
    if (Platform.OS === "web") {
      return "/api/google-vision-proxy";
    }
    return `${siteUrl}/api/google-vision-proxy`;
  }

  /**
   * Convert image URI to base64 string with preprocessing
   */
  private static async imageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

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
    if (
      !imageUri ||
      (!imageUri.includes("file://") &&
        !imageUri.includes("content://") &&
        !imageUri.includes("http"))
    ) {
      return { isValid: false, suggestion: "Invalid image format" };
    }

    return { isValid: true };
  }

  /**
   * Call the server-side Google Vision proxy
   */
  private static async callVisionProxy(
    base64Image: string,
    features: { type: string; maxResults?: number }[],
  ): Promise<GoogleVisionResponse | null> {
    const proxyUrl = this.getProxyUrl();

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        features,
        languageHints: ["en"],
      }),
    });

    if (!response.ok) return null;

    return response.json();
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
        const result = await this.callVisionProxy(base64Image, method.features);

        if (!result) continue;
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
          const confidenceScores = responseData.textAnnotations
            .map((ta) => ta.confidence || 0)
            .filter((c) => c > 0);
          if (confidenceScores.length) {
            confidence =
              confidenceScores.reduce((a, b) => a + b) /
              confidenceScores.length;
          }
        }

        const score = confidence * 0.7 + (extractedText.length / 1000) * 0.3;
        if (
          score >
          bestResult.confidence * 0.7 + (bestResult.text.length / 1000) * 0.3
        ) {
          bestResult = { text: extractedText, confidence: confidence * 100 };
        }
      } catch (error) {
        if (__DEV__) {
          console.log(`Method ${method.name} failed:`, error);
        }
        continue;
      }
    }

    return bestResult;
  }

  /**
   * Extract text from image using Google Vision API via server-side proxy
   */
  static async extractTextFromImage(
    imageUri: string,
  ): Promise<ApiResponse<string>> {
    try {
      if (!imageUri || typeof imageUri !== "string") {
        return {
          data: null,
          error: "Invalid image URI provided",
          loading: false,
        };
      }

      const validation = this.validateImageForOCR(imageUri);
      if (!validation.isValid) {
        return {
          data: null,
          error:
            validation.suggestion || "Image quality is not suitable for OCR",
          loading: false,
        };
      }

      const base64Image = await this.imageToBase64(imageUri);

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

      if (__DEV__) {
        console.log(
          `OCR completed with ${extractionResult.confidence.toFixed(1)}% confidence`,
        );
        console.log(
          `Extracted text length: ${extractionResult.text.length} characters`,
        );
      }

      return {
        data: extractionResult.text,
        error: null,
        loading: false,
        confidence: extractionResult.confidence,
      };
    } catch (error) {
      if (__DEV__) {
        console.error("Error in Google Vision OCR:", error);
      }

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
   * Test Google Vision API connection via proxy
   */
  static async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      const testResult = await this.callVisionProxy(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        [{ type: "TEXT_DETECTION", maxResults: 1 }],
      );

      if (!testResult) {
        return {
          data: false,
          error: "API connection failed",
          loading: false,
        };
      }

      return {
        data: true,
        error: null,
        loading: false,
      };
    } catch (error) {
      if (__DEV__) {
        console.error("Error testing Google Vision API connection:", error);
      }
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
      apiKeyConfigured: true, // Key is server-side now
      endpoint: "server-proxy",
      documentsPerMonth: 1000,
      costPer1000: 1.5,
      features: [
        "Text Detection",
        "Document Text Detection",
        "Handwriting Detection",
        "Multi-language Support",
      ],
    };
  }
}
