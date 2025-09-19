import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabaseClient';
import { GoogleVisionService } from './googleVisionService';
import { OCRExtractedData, ServiceType, ApiResponse } from '../../types';

export interface ReceiptProcessingResult {
  success: boolean;
  data?: OCRExtractedData;
  error?: string;
  imageUri?: string;
  uploadedImageUrl?: string;
}

export class OCRService {
  // Service type mapping for common keywords
  private static SERVICE_TYPE_KEYWORDS = {
    oil_change: ['oil change', 'oil service', 'lube', 'motor oil', 'synthetic oil', 'conventional oil'],
    tire_rotation: ['tire rotation', 'tire service', 'rotate tires', 'wheel rotation'],
    brake_service: ['brake', 'brake service', 'brake pad', 'brake fluid', 'brake repair'],
    general_maintenance: ['maintenance', 'tune up', 'service', 'check up', 'inspection service'],
    repair: ['repair', 'fix', 'replacement', 'diagnostic'],
    inspection: ['inspection', 'state inspection', 'safety inspection', 'emissions test'],
  };

  // Common service business names for better context
  private static SERVICE_BUSINESSES = [
    'jiffy lube', 'valvoline', 'mobil 1', 'quick lube', 'oil express',
    'midas', 'firestone', 'goodyear', 'pep boys', 'autozone',
    'advance auto', 'ntb', 'tire kingdom', 'brake check'
  ];

  /**
   * Request camera/gallery permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      return cameraStatus === 'granted' && mediaStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Launch camera to capture receipt
   */
  static async captureReceiptFromCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions are required to capture receipts');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error capturing receipt from camera:', error);
      return null;
    }
  }

  /**
   * Pick receipt from gallery
   */
  static async pickReceiptFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Gallery permissions are required to select receipts');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error picking receipt from gallery:', error);
      return null;
    }
  }

  /**
   * Upload image to Supabase storage
   */
  static async uploadReceiptImage(imageUri: string, fileName: string): Promise<ApiResponse<string>> {
    try {
      // Validate inputs
      if (!imageUri || typeof imageUri !== 'string') {
        console.error('Invalid imageUri provided:', imageUri);
        return { data: null, error: 'Invalid image URI provided', loading: false };
      }

      if (!fileName || typeof fileName !== 'string') {
        console.error('Invalid fileName provided:', fileName);
        return { data: null, error: 'Invalid file name provided', loading: false };
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Read image as array buffer
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      // Create unique filename
      const timestamp = new Date().getTime();
      const uniqueFileName = `${user.id}/${timestamp}_${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('receipt-images')
        .upload(uniqueFileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading receipt image:', error);
        return { data: null, error: error.message, loading: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(data.path);

      return { data: urlData.publicUrl, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error uploading receipt image:', error);
      return { data: null, error: 'Failed to upload receipt image', loading: false };
    }
  }

  /**
   * Extract text from image using Google Vision API
   */
  static async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      console.log('Extracting text from image using Google Vision API...');

      const result = await GoogleVisionService.extractTextFromImage(imageUri);

      if (result.error) {
        console.error('Google Vision API error:', result.error);
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('No text was extracted from the image');
      }

      console.log('Text extraction successful, length:', result.data.length);
      return result.data;
    } catch (error) {
      console.error('Error extracting text from image:', error);

      // Provide fallback with more specific error message
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Google Vision API is not configured. Please set up your API key.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw error;
        }
      }

      throw new Error('Failed to extract text from receipt');
    }
  }

  /**
   * Parse extracted text to identify service information
   */
  static parseExtractedText(rawText: string): OCRExtractedData['extracted_fields'] {
    // Validate input
    if (!rawText || typeof rawText !== 'string') {
      console.warn('Invalid rawText provided to parseExtractedText:', rawText);
      return {
        confidence_scores: {}
      };
    }

    const text = rawText.toLowerCase();
    const lines = rawText.split('\n');

    const extracted: OCRExtractedData['extracted_fields'] = {
      confidence_scores: {}
    };

    // Extract service type
    let highestServiceTypeMatch = '';
    let highestServiceTypeScore = 0;

    for (const [serviceType, keywords] of Object.entries(this.SERVICE_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          const score = keyword.length / text.length * 100;
          if (score > highestServiceTypeScore) {
            highestServiceTypeScore = score;
            highestServiceTypeMatch = serviceType;
          }
        }
      }
    }

    if (highestServiceTypeMatch) {
      extracted.service_type = highestServiceTypeMatch;
      extracted.confidence_scores!.service_type = Math.min(highestServiceTypeScore * 10, 95);
    }

    // Extract cost
    const costPattern = /\$(\d+\.?\d*)/g;
    const costMatches = rawText.match(costPattern);
    if (costMatches && costMatches.length > 0) {
      // Take the last/largest amount as it's likely the total
      const costs = costMatches
        .filter(match => match && typeof match === 'string')
        .map(match => parseFloat(match.replace('$', '')))
        .filter(cost => !isNaN(cost));

      if (costs.length > 0) {
        extracted.cost = Math.max(...costs);
        extracted.confidence_scores!.cost = 80;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/g,   // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/g,   // DD-MM-YYYY
    ];

    for (const pattern of datePatterns) {
      const dateMatch = rawText.match(pattern);
      if (dateMatch) {
        extracted.date = dateMatch[0];
        extracted.confidence_scores!.date = 75;
        break;
      }
    }

    // Extract mileage/odometer reading
    const mileagePatterns = [
      /mileage:?\s*(\d+[,\.]?\d*)/gi,
      /odometer:?\s*(\d+[,\.]?\d*)/gi,
      /miles:?\s*(\d+[,\.]?\d*)/gi,
    ];

    for (const pattern of mileagePatterns) {
      const mileageMatch = text.match(pattern);
      if (mileageMatch && mileageMatch[1] && typeof mileageMatch[1] === 'string') {
        const cleanedMileage = mileageMatch[1].replace(/[,\.]/g, '');
        const mileage = parseInt(cleanedMileage);
        if (!isNaN(mileage) && mileage > 0 && mileage < 1000000) { // Reasonable range
          extracted.odometer_reading = mileage;
          extracted.confidence_scores!.odometer_reading = 70;
          break;
        }
      }
    }

    // Extract business name
    for (const business of this.SERVICE_BUSINESSES) {
      if (text.includes(business)) {
        extracted.business_name = business.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        break;
      }
    }

    // Generate description based on services found
    const serviceKeywords = [];
    if (text.includes('oil')) serviceKeywords.push('oil change');
    if (text.includes('filter')) serviceKeywords.push('filter replacement');
    if (text.includes('inspection')) serviceKeywords.push('inspection');
    if (text.includes('brake')) serviceKeywords.push('brake service');
    if (text.includes('tire')) serviceKeywords.push('tire service');

    if (serviceKeywords.length > 0) {
      extracted.description = serviceKeywords.join(', ');
      extracted.confidence_scores!.description = 60;
    } else if (extracted.business_name) {
      extracted.description = `Service at ${extracted.business_name}`;
      extracted.confidence_scores!.description = 40;
    }

    return extracted;
  }

  /**
   * Process receipt image end-to-end
   */
  static async processReceiptImage(imageUri: string): Promise<ReceiptProcessingResult> {
    try {
      // Validate input
      if (!imageUri || typeof imageUri !== 'string') {
        console.error('Invalid imageUri provided to processReceiptImage:', imageUri);
        return {
          success: false,
          error: 'Invalid image URI provided'
        };
      }

      // Extract text from image
      const rawText = await this.extractTextFromImage(imageUri);

      if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
        return {
          success: false,
          error: 'No text could be extracted from the receipt image'
        };
      }

      // Parse extracted text
      const extractedFields = this.parseExtractedText(rawText);

      // Calculate overall confidence score
      const confidenceScores = extractedFields.confidence_scores || {};
      const scores = Object.values(confidenceScores);
      const averageConfidence = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 30;

      const ocrData: OCRExtractedData = {
        raw_text: rawText,
        confidence: Math.round(averageConfidence),
        extracted_fields: extractedFields,
        processing_timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: ocrData,
        imageUri,
      };
    } catch (error) {
      console.error('Error processing receipt image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process receipt image'
      };
    }
  }

  /**
   * Process receipt from camera capture
   */
  static async processReceiptFromCamera(): Promise<ReceiptProcessingResult> {
    try {
      const imageResult = await this.captureReceiptFromCamera();

      if (!imageResult || imageResult.canceled || !imageResult.assets || imageResult.assets.length === 0) {
        return {
          success: false,
          error: 'Receipt capture was cancelled'
        };
      }

      const imageUri = imageResult.assets[0].uri;
      return await this.processReceiptImage(imageUri);
    } catch (error) {
      console.error('Error processing receipt from camera:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process receipt from camera'
      };
    }
  }

  /**
   * Process receipt from gallery selection
   */
  static async processReceiptFromGallery(): Promise<ReceiptProcessingResult> {
    try {
      const imageResult = await this.pickReceiptFromGallery();

      if (!imageResult || imageResult.canceled || !imageResult.assets || imageResult.assets.length === 0) {
        return {
          success: false,
          error: 'Receipt selection was cancelled'
        };
      }

      const imageUri = imageResult.assets[0].uri;
      return await this.processReceiptImage(imageUri);
    } catch (error) {
      console.error('Error processing receipt from gallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process receipt from gallery'
      };
    }
  }

  /**
   * Save picture from camera without OCR processing
   */
  static async savePictureFromCamera(): Promise<ReceiptProcessingResult> {
    try {
      const imageResult = await this.captureReceiptFromCamera();

      if (!imageResult || imageResult.canceled || !imageResult.assets || imageResult.assets.length === 0) {
        return {
          success: false,
          error: 'Picture capture was cancelled'
        };
      }

      const imageUri = imageResult.assets[0].uri;

      // Upload image without OCR processing
      const uploadResult = await this.uploadReceiptImage(
        imageUri,
        `picture_${Date.now()}.jpg`
      );

      if (uploadResult.error) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      return {
        success: true,
        imageUri,
        uploadedImageUrl: uploadResult.data || undefined,
        data: undefined // No OCR data
      };
    } catch (error) {
      console.error('Error saving picture from camera:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save picture from camera'
      };
    }
  }

  /**
   * Save picture from gallery without OCR processing
   */
  static async savePictureFromGallery(): Promise<ReceiptProcessingResult> {
    try {
      const imageResult = await this.pickReceiptFromGallery();

      if (!imageResult || imageResult.canceled || !imageResult.assets || imageResult.assets.length === 0) {
        return {
          success: false,
          error: 'Picture selection was cancelled'
        };
      }

      const imageUri = imageResult.assets[0].uri;

      // Upload image without OCR processing
      const uploadResult = await this.uploadReceiptImage(
        imageUri,
        `picture_${Date.now()}.jpg`
      );

      if (uploadResult.error) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      return {
        success: true,
        imageUri,
        uploadedImageUrl: uploadResult.data || undefined,
        data: undefined // No OCR data
      };
    } catch (error) {
      console.error('Error saving picture from gallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save picture from gallery'
      };
    }
  }
}