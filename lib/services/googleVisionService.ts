import Constants from 'expo-constants';
import { ApiResponse } from '../../types';

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
    }>;
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

export class GoogleVisionService {
  private static config: GoogleVisionConfig = {
    apiKey: Constants.expoConfig?.extra?.googleVisionApiKey || '',
    endpoint: 'https://vision.googleapis.com/v1/images:annotate'
  };

  /**
   * Initialize Google Vision service with API key
   */
  static setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  /**
   * Convert image URI to base64 string
   */
  private static async imageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we need to fetch the image and convert to base64
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image for OCR');
    }
  }

  /**
   * Extract text from image using Google Vision API
   */
  static async extractTextFromImage(imageUri: string): Promise<ApiResponse<string>> {
    try {
      // Validate API key
      if (!this.config.apiKey) {
        return {
          data: null,
          error: 'Google Vision API key not configured. Please set GOOGLE_VISION_API_KEY in your environment variables.',
          loading: false
        };
      }

      // Validate image URI
      if (!imageUri || typeof imageUri !== 'string') {
        return {
          data: null,
          error: 'Invalid image URI provided',
          loading: false
        };
      }

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);

      // Prepare the request payload
      const requestPayload = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      };

      // Make request to Google Vision API
      const response = await fetch(`${this.config.endpoint}?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Vision API error:', response.status, errorText);
        return {
          data: null,
          error: `Google Vision API error: ${response.status} - ${errorText}`,
          loading: false
        };
      }

      const result: GoogleVisionResponse = await response.json();

      // Check for API errors in response
      if (result.responses?.[0]?.error) {
        const error = result.responses[0].error;
        console.error('Google Vision API returned error:', error);
        return {
          data: null,
          error: `Google Vision API error: ${error.message}`,
          loading: false
        };
      }

      // Extract text from response
      const textAnnotations = result.responses?.[0]?.textAnnotations;
      const fullTextAnnotation = result.responses?.[0]?.fullTextAnnotation;

      let extractedText = '';

      if (fullTextAnnotation?.text) {
        extractedText = fullTextAnnotation.text;
      } else if (textAnnotations && textAnnotations.length > 0) {
        extractedText = textAnnotations[0].description;
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return {
          data: null,
          error: 'No text was detected in the image. Please ensure the receipt is clearly visible and try again.',
          loading: false
        };
      }

      return {
        data: extractedText,
        error: null,
        loading: false
      };

    } catch (error) {
      console.error('Error in Google Vision OCR:', error);

      // Provide specific error messages for common issues
      let errorMessage = 'Failed to extract text from image';

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('base64')) {
          errorMessage = 'Failed to process image. Please try taking a new photo.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        data: null,
        error: errorMessage,
        loading: false
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
          error: 'Google Vision API key not configured',
          loading: false
        };
      }

      // Create a minimal test request
      const testPayload = {
        requests: [
          {
            image: {
              content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 transparent PNG
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      };

      const response = await fetch(`${this.config.endpoint}?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        return {
          data: false,
          error: `API connection failed: ${response.status}`,
          loading: false
        };
      }

      return {
        data: true,
        error: null,
        loading: false
      };

    } catch (error) {
      console.error('Error testing Google Vision API connection:', error);
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        loading: false
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
      costPer1000: 1.50, // USD
      features: [
        'Text Detection',
        'Document Text Detection',
        'Handwriting Detection',
        'Multi-language Support'
      ]
    };
  }
}