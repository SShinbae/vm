import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
} from 'react-native';

// Only import react-dom createPortal on web
let createPortal: any = null;
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reactDom = require('react-dom');
    createPortal = reactDom.createPortal;
  } catch (error) {
    console.warn('react-dom not available', error);
  }
}

// Only import ReactCrop on web
let ReactCrop: any = null;
let centerCrop: any = null;
let makeAspectCrop: any = null;
let convertToPixelCrop: any = null;

if (Platform.OS === 'web') {
  try {
    // Dynamic import for web-only dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cropModule = require('react-image-crop');
    ReactCrop = cropModule.default;
    centerCrop = cropModule.centerCrop;
    makeAspectCrop = cropModule.makeAspectCrop;
    convertToPixelCrop = cropModule.convertToPixelCrop;
    console.log('react-image-crop loaded successfully');
  } catch (error) {
    console.warn('react-image-crop not available', error);
  }
}

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCropComplete: (croppedImageFile: File) => void;
  onError: (error: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete,
  onError,
}) => {
  const [crop, setCrop] = useState<any>();
  const [completedCrop, setCompletedCrop] = useState<any>();
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Initialize crop when image is first loaded
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Image loaded, setting up crop');
    
    if (centerCrop && makeAspectCrop) {
      const { width, height } = e.currentTarget;
      console.log('Image dimensions:', { width, height });

      try {
        // Create initial crop - centered square taking up 80% of the image
        const initialCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 80,
            },
            1, // 1:1 aspect ratio for square crop
            width,
            height,
          ),
          width,
          height,
        );

        console.log('Generated initial crop:', initialCrop);
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
      } catch (error) {
        console.error('Error creating initial crop:', error);
        // Fallback to a simple centered crop
        const fallbackCrop = {
          unit: '%' as const,
          width: 80,
          height: 80,
          x: 10,
          y: 10,
        };
        setCrop(fallbackCrop);
        setCompletedCrop(fallbackCrop);
      }
    } else {
      console.warn('centerCrop or makeAspectCrop not available, using fallback');
      // Fallback crop if react-image-crop functions aren't available
      const fallbackCrop = {
        unit: '%' as const,
        width: 80,
        height: 80,
        x: 10,
        y: 10,
      };
      setCrop(fallbackCrop);
      setCompletedCrop(fallbackCrop);
    }
  }, []);

    const getCroppedImage = useCallback(async (): Promise<File | null> => {
    // Use completedCrop if available, otherwise fall back to current crop
    const cropToUse = completedCrop || crop;
    
    console.log('getCroppedImage called', {
      completedCrop,
      crop,
      cropToUse,
      imgRefCurrent: !!imgRef.current,
      convertToPixelCrop: !!convertToPixelCrop
    });

    if (!cropToUse) {
      console.error('No crop available');
      return null;
    }

    if (!imgRef.current) {
      console.error('No image reference available');
      return null;
    }

    if (!convertToPixelCrop) {
      console.error('convertToPixelCrop function not available');
      return null;
    }

    setProcessing(true);

    try {
      const image = imgRef.current;
      console.log('Image details:', {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        displayWidth: image.width,
        displayHeight: image.height,
        cropToUse
      });

      // Validate that we have valid crop data
      if (!cropToUse.width || !cropToUse.height || cropToUse.width <= 0 || cropToUse.height <= 0) {
        throw new Error('Invalid crop dimensions');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to create canvas context');
      }

      // Convert percentage crop to pixel crop
      const pixelCrop = convertToPixelCrop(
        cropToUse,
        image.naturalWidth,
        image.naturalHeight,
      );

      console.log('Converted pixel crop:', pixelCrop);

      // Validate pixel crop
      if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
        throw new Error('Invalid pixel crop dimensions');
      }

      // Set canvas size to crop size
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      console.log('Canvas size set to:', { width: canvas.width, height: canvas.height });

      // Draw the cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      console.log('Image drawn on canvas');

      return new Promise<File>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            reject(new Error('Failed to create image blob from canvas'));
            return;
          }
          const file = new File([blob], 'cropped-avatar.jpg', { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log('Created cropped file:', { name: file.name, size: file.size, type: file.type });
          resolve(file);
        }, 'image/jpeg', 0.9);
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [completedCrop, crop]);

  const handleSave = async () => {
    console.log('handleSave called', { completedCrop, processing });

    if (processing) {
      console.log('Already processing, ignoring click');
      return;
    }

    // If we don't have a completed crop but we have a current crop, use that
    let cropToUse = completedCrop;
    if (!cropToUse && crop) {
      console.log('No completed crop, using current crop');
      cropToUse = crop;
      setCompletedCrop(crop);
    }

    if (!cropToUse) {
      console.error('No crop available');
      onError('Please select a crop area by dragging on the image');
      return;
    }

    console.log('Starting crop save process with crop:', cropToUse);

    try {
      const result = await getCroppedImage();
      if (result) {
        console.log('Successfully cropped image, calling onCropComplete');
        onCropComplete(result);
        onClose();
      } else {
        console.error('getCroppedImage returned null');
        onError('Failed to crop image - no result returned');
      }
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      onError(error.message || 'Failed to process image');
    }
  };

  if (Platform.OS !== 'web' || !ReactCrop) {
    return null;
  }

  if (!visible) return null;

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2147483647
    }}>
      <div style={{
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 20,
        maxWidth: 600,
        width: '90%',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: colors.text,
              margin: 0
            }}>
              Crop Profile Picture
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                color: colors.text,
                fontSize: 20
              }}
            >
              ✕
            </button>
          </div>

          <p style={{
            fontSize: 14,
            color: colors.icon,
            textAlign: 'center',
            marginBottom: 16
          }}>
            Drag to adjust the crop area. The image will be cropped to a square for your profile picture.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            {ReactCrop ? (
              <ReactCrop
                crop={crop}
                onChange={(newCrop: any, percentCrop: any) => {
                  console.log('Crop changed:', { newCrop, percentCrop });
                  setCrop(percentCrop);
                }}
                onComplete={(c: any, percentCrop: any) => {
                  console.log('Crop completed:', { c, percentCrop });
                  // Make sure we always have a valid completed crop
                  if (percentCrop && percentCrop.width > 0 && percentCrop.height > 0) {
                    setCompletedCrop(percentCrop);
                  } else if (c && c.width > 0 && c.height > 0) {
                    setCompletedCrop(c);
                  }
                }}
                aspect={1}
                minWidth={50}
                minHeight={50}
                circularCrop={false}
                ruleOfThirds={true}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                }}
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageUri}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    display: 'block',
                  }}
                  onLoad={onImageLoad}
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    onError('Failed to load image for cropping');
                  }}
                />
              </ReactCrop>
            ) : (
              <div style={{ 
                padding: 20, 
                textAlign: 'center', 
                color: '#ff0000',
                border: '2px dashed #ff0000',
                borderRadius: 8,
                backgroundColor: '#fff5f5'
              }}>
                <p>ReactCrop component not loaded.</p>
                <p>Make sure react-image-crop is installed:</p>
                <code>npm install react-image-crop</code>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 20
          }}>
            <button
              onClick={onClose}
              disabled={processing}
              style={{
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.text,
                fontSize: 16,
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              ✕ Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={processing || !completedCrop}
              style={{
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 8,
                backgroundColor: colors.tint,
                border: 'none',
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                cursor: (processing || !completedCrop) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: (processing || !completedCrop) ? 0.6 : 1
              }}
            >
              {processing ? '⏳ Processing...' : '✓ Save'}
            </button>
          </div>
      </div>
    </div>
  );

  // Use createPortal if available to render outside the current component tree
  if (createPortal && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  // Fallback to normal rendering
  return modalContent;
};