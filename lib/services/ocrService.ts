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
  // Enhanced service type mapping with weighted keywords
  private static SERVICE_TYPE_KEYWORDS = {
    oil_change: {
      primary: ['oil change', 'oil service', 'lube service', 'oil and filter'],
      secondary: ['motor oil', 'synthetic oil', 'conventional oil', 'engine oil'],
      contextual: ['filter', 'drain', 'refill', 'lubrication'],
      weight: { primary: 10, secondary: 6, contextual: 3 }
    },
    tire_rotation: {
      primary: ['tire rotation', 'tire service', 'rotate tires'],
      secondary: ['wheel rotation', 'tire balance', 'wheel alignment'],
      contextual: ['rotation', 'balance', 'alignment', 'mounting'],
      weight: { primary: 10, secondary: 6, contextual: 3 }
    },
    brake_service: {
      primary: ['brake service', 'brake repair', 'brake pad replacement'],
      secondary: ['brake pad', 'brake fluid', 'brake rotor', 'brake disc'],
      contextual: ['brake', 'stopping', 'hydraulic', 'calipers'],
      weight: { primary: 10, secondary: 6, contextual: 3 }
    },
    general_maintenance: {
      primary: ['maintenance', 'tune up', 'service package', 'full service'],
      secondary: ['check up', 'inspection service', 'multi-point', 'preventive'],
      contextual: ['maintain', 'servicing', 'upkeep', 'routine'],
      weight: { primary: 10, secondary: 6, contextual: 3 }
    },
    repair: {
      primary: ['repair', 'diagnostic', 'troubleshoot', 'replacement'],
      secondary: ['fix', 'diagnose', 'replace', 'rebuild'],
      contextual: ['problem', 'issue', 'fault', 'malfunction'],
      weight: { primary: 10, secondary: 6, contextual: 3 }
    },
    inspection: {
      primary: ['inspection', 'state inspection', 'safety inspection', 'emissions test'],
      secondary: ['smog test', 'vehicle inspection', 'annual inspection'],
      contextual: ['test', 'check', 'certification', 'compliance'],
      weight: { primary: 10, secondary: 6, contextual: 3 }
    }
  };

  // Enhanced service business database with scoring
  private static SERVICE_BUSINESSES = {
    // Chain auto services
    chains: {
      'jiffy lube': { variants: ['jiffy lube', 'jiffylube'], score: 8 },
      'valvoline instant oil change': { variants: ['valvoline', 'valvoline instant'], score: 8 },
      'mobil 1 lube express': { variants: ['mobil 1', 'mobil one', 'exxonmobil'], score: 8 },
      'quick lube': { variants: ['quick lube', 'quicklube'], score: 6 },
      'midas': { variants: ['midas', 'midas auto'], score: 7 },
      'firestone': { variants: ['firestone', 'firestone complete'], score: 7 },
      'goodyear': { variants: ['goodyear', 'goodyear tire'], score: 7 },
      'pep boys': { variants: ['pep boys', 'pepboys'], score: 7 },
      'autozone': { variants: ['autozone', 'auto zone'], score: 6 },
      'ntb': { variants: ['ntb', 'national tire'], score: 6 },
      'tire kingdom': { variants: ['tire kingdom', 'tirekingdom'], score: 6 }
    },
    // Common patterns for independent shops
    patterns: [
      { regex: /([\w\s]+)\s+(auto|automotive|service|garage|shop|tire|oil)/i, score: 5 },
      { regex: /([\w\s]+)\s+(lube|quick|express)/i, score: 4 },
      { regex: /(\w+)'?s\s+(auto|service|garage|shop)/i, score: 4 }
    ]
  };

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
   * Launch camera to capture receipt with optimized settings for OCR
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
        aspect: [2, 3], // Better aspect ratio for receipts (taller)
        quality: 1.0,   // Maximum quality for better OCR
        base64: false,
        exif: false,    // Don't include EXIF data to reduce size
        // Additional camera settings for better text capture
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        preferredAssetRepresentationMode: ImagePicker.AssetRepresentationMode.Current,
      });

      return result;
    } catch (error) {
      console.error('Error capturing receipt from camera:', error);
      return null;
    }
  }

  /**
   * Pick receipt from gallery with optimized settings for OCR
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
        aspect: [2, 3], // Better aspect ratio for receipts (taller)
        quality: 1.0,   // Maximum quality for better OCR
        base64: false,
        exif: false,    // Don't include EXIF data to reduce size
        // Allow selection of high-quality images
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        preferredAssetRepresentationMode: ImagePicker.AssetRepresentationMode.Current,
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
   * Extract text from image using Google Vision API (deprecated - use GoogleVisionService directly)
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
   * Advanced service type detection with weighted scoring
   */
  private static detectServiceType(text: string): { type: string; score: number } {
    const lowerText = text.toLowerCase();
    let bestMatch = { type: '', score: 0 };

    for (const [serviceType, keywords] of Object.entries(this.SERVICE_TYPE_KEYWORDS)) {
      let totalScore = 0;
      let matchCount = 0;

      // Check primary keywords
      for (const keyword of keywords.primary) {
        if (lowerText.includes(keyword.toLowerCase())) {
          totalScore += keywords.weight.primary;
          matchCount++;
        }
      }

      // Check secondary keywords
      for (const keyword of keywords.secondary) {
        if (lowerText.includes(keyword.toLowerCase())) {
          totalScore += keywords.weight.secondary;
          matchCount++;
        }
      }

      // Check contextual keywords
      for (const keyword of keywords.contextual) {
        if (lowerText.includes(keyword.toLowerCase())) {
          totalScore += keywords.weight.contextual;
          matchCount++;
        }
      }

      // Boost score based on proximity of keywords
      if (matchCount > 1) {
        totalScore *= (1 + (matchCount - 1) * 0.2);
      }

      if (totalScore > bestMatch.score) {
        bestMatch = { type: serviceType, score: totalScore };
      }
    }

    return bestMatch;
  }

  /**
   * Enhanced cost extraction with context analysis
   */
  private static extractCost(text: string): { cost: number; confidence: number } {
    const lines = text.split('\n');
    const costs = [];

    // Enhanced cost patterns with context
    const costPatterns = [
      // Total patterns (highest priority)
      { pattern: /(?:total|grand\s*total|amount\s*due|final\s*total)[:\s]*\$([0-9,]+\.?[0-9]*)/gi, weight: 10, type: 'total' },
      { pattern: /\$([0-9,]+\.?[0-9]*)\s*(?:total|due|owed)/gi, weight: 10, type: 'total' },

      // Service-specific patterns
      { pattern: /(?:service|labor|parts)[:\s]*\$([0-9,]+\.?[0-9]*)/gi, weight: 8, type: 'service' },

      // Tax patterns (lower priority)
      { pattern: /(?:tax|hst|gst|pst)[:\s]*\$([0-9,]+\.?[0-9]*)/gi, weight: 3, type: 'tax' },

      // Generic dollar amounts
      { pattern: /\$([0-9,]+\.?[0-9]*)/g, weight: 1, type: 'generic' }
    ];

    for (const line of lines) {
      for (const { pattern, weight, type } of costPatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(amount) && amount > 0 && amount < 10000) { // Reasonable range
            costs.push({ amount, weight, type, line: line.trim() });
          }
        }
      }
    }

    if (costs.length === 0) {
      return { cost: 0, confidence: 0 };
    }

    // Sort by weight (descending) and amount (descending for same weight)
    costs.sort((a, b) => {
      if (a.weight !== b.weight) return b.weight - a.weight;
      return b.amount - a.amount;
    });

    const bestCost = costs[0];
    let confidence = 0;

    switch (bestCost.type) {
      case 'total':
        confidence = 95;
        break;
      case 'service':
        confidence = 85;
        break;
      case 'tax':
        confidence = 40;
        break;
      default:
        confidence = costs.length === 1 ? 70 : 50;
    }

    return { cost: bestCost.amount, confidence };
  }

  /**
   * Enhanced date extraction with multiple formats
   */
  private static extractDate(text: string): { date: string; confidence: number } {
    const datePatterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      { pattern: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/g, confidence: 85, format: 'US' },
      // DD/MM/YYYY or DD-MM-YYYY
      { pattern: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/g, confidence: 80, format: 'EU' },
      // YYYY-MM-DD
      { pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/g, confidence: 90, format: 'ISO' },
      // Month DD, YYYY
      { pattern: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi, confidence: 95, format: 'written' },
      // Mon DD, YYYY
      { pattern: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/gi, confidence: 90, format: 'abbreviated' },
    ];

    const lines = text.split('\n');
    let bestMatch = { date: '', confidence: 0 };

    for (const line of lines) {
      // Skip lines that are too long or seem irrelevant
      if (line.length > 100) continue;

      for (const { pattern, confidence, format } of datePatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          if (confidence > bestMatch.confidence) {
            let dateStr = match[0];

            // Additional validation for date ranges
            if (format === 'US' || format === 'EU') {
              const parts = dateStr.split(/[\/-]/);
              const month = parseInt(parts[format === 'US' ? 0 : 1]);
              const day = parseInt(parts[format === 'US' ? 1 : 0]);
              const year = parseInt(parts[2]);

              if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2030) {
                continue;
              }
            }

            bestMatch = { date: dateStr, confidence };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Enhanced mileage/odometer extraction
   */
  private static extractOdometer(text: string): { odometer: number; confidence: number } {
    const lines = text.split('\n');
    const odometerPatterns = [
      { pattern: /(?:odometer|odo|mileage|miles?)[:=\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/gi, confidence: 90 },
      { pattern: /(?:current\s+)?(?:mileage|miles?)[:=\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/gi, confidence: 85 },
      { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:miles?|km|kilometres?)/gi, confidence: 75 },
      { pattern: /(?:at|@)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:miles?|km)/gi, confidence: 80 },
    ];

    let bestMatch = { odometer: 0, confidence: 0 };

    for (const line of lines) {
      for (const { pattern, confidence } of odometerPatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          const reading = parseInt(match[1].replace(/,/g, ''));
          if (!isNaN(reading) && reading > 0 && reading < 1000000) {
            if (confidence > bestMatch.confidence) {
              bestMatch = { odometer: reading, confidence };
            }
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Enhanced business name extraction
   */
  private static extractBusinessName(text: string): { name: string; confidence: number } {
    const lines = text.split('\n');
    let bestMatch = { name: '', confidence: 0 };

    // Check for known chains first
    for (const [businessName, { variants, score }] of Object.entries(this.SERVICE_BUSINESSES.chains)) {
      for (const variant of variants) {
        if (text.toLowerCase().includes(variant.toLowerCase())) {
          if (score > bestMatch.confidence) {
            bestMatch = {
              name: businessName.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' '),
              confidence: score * 10
            };
          }
        }
      }
    }

    // Check patterns for independent shops
    if (bestMatch.confidence < 70) {
      for (const line of lines.slice(0, 5)) { // Check first 5 lines
        if (line.length > 50) continue; // Skip very long lines

        for (const { regex, score } of this.SERVICE_BUSINESSES.patterns) {
          const match = line.match(regex);
          if (match && score * 10 > bestMatch.confidence) {
            bestMatch = {
              name: line.trim(),
              confidence: score * 10
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Parse extracted text to identify service information with enhanced accuracy
   */
  static parseExtractedText(rawText: string): OCRExtractedData['extracted_fields'] {
    // Validate input
    if (!rawText || typeof rawText !== 'string') {
      console.warn('Invalid rawText provided to parseExtractedText:', rawText);
      return { confidence_scores: {} };
    }

    const extracted: OCRExtractedData['extracted_fields'] = {
      confidence_scores: {}
    };

    // Extract service type with weighted scoring
    const serviceTypeResult = this.detectServiceType(rawText);
    if (serviceTypeResult.score > 5) {
      extracted.service_type = serviceTypeResult.type;
      extracted.confidence_scores!.service_type = Math.min(serviceTypeResult.score * 5, 95);
    }

    // Extract cost with context analysis
    const costResult = this.extractCost(rawText);
    if (costResult.cost > 0) {
      extracted.cost = costResult.cost;
      extracted.confidence_scores!.cost = costResult.confidence;
    }

    // Extract date with multiple format support
    const dateResult = this.extractDate(rawText);
    if (dateResult.date) {
      extracted.date = dateResult.date;
      extracted.confidence_scores!.date = dateResult.confidence;
    }

    // Extract odometer reading
    const odometerResult = this.extractOdometer(rawText);
    if (odometerResult.odometer > 0) {
      extracted.odometer_reading = odometerResult.odometer;
      extracted.confidence_scores!.odometer_reading = odometerResult.confidence;
    }

    // Extract business name
    const businessResult = this.extractBusinessName(rawText);
    if (businessResult.name) {
      extracted.business_name = businessResult.name;
    }

    // Generate intelligent description
    this.generateDescription(extracted, rawText);

    return extracted;
  }

  /**
   * Generate intelligent service description
   */
  private static generateDescription(extracted: OCRExtractedData['extracted_fields'], rawText: string): void {
    const parts = [];

    // Add service type if detected
    if (extracted.service_type) {
      const readableType = extracted.service_type.replace('_', ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      parts.push(readableType);
    }

    // Look for specific service details in text
    const text = rawText.toLowerCase();
    const serviceDetails = [];

    if (text.includes('oil') && text.includes('filter')) {
      serviceDetails.push('oil & filter change');
    } else if (text.includes('oil')) {
      serviceDetails.push('oil change');
    } else if (text.includes('filter')) {
      serviceDetails.push('filter replacement');
    }

    if (text.includes('tire') && text.includes('rotation')) {
      serviceDetails.push('tire rotation');
    }

    if (text.includes('brake')) {
      serviceDetails.push('brake service');
    }

    if (text.includes('inspection')) {
      serviceDetails.push('vehicle inspection');
    }

    // Combine parts
    if (serviceDetails.length > 0) {
      parts.push(...serviceDetails);
    }

    if (extracted.business_name && !parts.some(p => p.toLowerCase().includes('service'))) {
      parts.push(`at ${extracted.business_name}`);
    }

    if (parts.length > 0) {
      extracted.description = parts.join(', ');
      extracted.confidence_scores!.description = Math.min(parts.length * 20 + 40, 85);
    } else {
      extracted.description = 'Vehicle service';
      extracted.confidence_scores!.description = 30;
    }
  }

  /**
   * Calculate overall confidence with multi-factor analysis
   */
  private static calculateOverallConfidence(extractedFields: OCRExtractedData['extracted_fields'], ocrConfidence: number = 0): number {
    const confidenceScores = extractedFields.confidence_scores || {};
    const fieldScores = Object.values(confidenceScores);

    if (fieldScores.length === 0) {
      return Math.max(ocrConfidence * 0.3, 20); // Minimum 20% if we have some text
    }

    // Weight different fields by importance
    const weights = {
      cost: 0.3,          // Most important for receipts
      service_type: 0.25,  // Second most important
      date: 0.2,          // Important for record keeping
      odometer_reading: 0.15, // Useful but not critical
      description: 0.1     // Least critical as it's often generated
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [field, score] of Object.entries(confidenceScores)) {
      const weight = weights[field as keyof typeof weights] || 0.05;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    const fieldConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Combine with OCR confidence (40% field analysis, 40% OCR confidence, 20% completeness bonus)
    const completenessBonus = (fieldScores.length / 5) * 20; // Bonus for having more fields
    const finalConfidence = (fieldConfidence * 0.4) + (ocrConfidence * 0.4) + (completenessBonus * 0.2);

    return Math.min(Math.round(finalConfidence), 95); // Cap at 95%
  }

  /**
   * Process receipt image end-to-end with enhanced analysis
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

      // Extract text from image with confidence
      const extractionResult = await GoogleVisionService.extractTextFromImage(imageUri);

      if (extractionResult.error || !extractionResult.data) {
        return {
          success: false,
          error: extractionResult.error || 'No text could be extracted from the receipt image'
        };
      }

      const rawText = extractionResult.data;
      const ocrConfidence = extractionResult.confidence || 0;

      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          error: 'No text could be extracted from the receipt image'
        };
      }

      console.log(`Processing receipt with ${rawText.length} characters, OCR confidence: ${ocrConfidence.toFixed(1)}%`);

      // Parse extracted text with enhanced methods
      const extractedFields = this.parseExtractedText(rawText);

      // Calculate sophisticated overall confidence
      const overallConfidence = this.calculateOverallConfidence(extractedFields, ocrConfidence);

      const ocrData: OCRExtractedData = {
        raw_text: rawText,
        confidence: overallConfidence,
        extracted_fields: extractedFields,
        processing_timestamp: new Date().toISOString(),
      };

      console.log(`Processing complete. Final confidence: ${overallConfidence}%`);
      console.log('Extracted fields:', Object.keys(extractedFields).filter(k => k !== 'confidence_scores' && extractedFields[k as keyof typeof extractedFields]));

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