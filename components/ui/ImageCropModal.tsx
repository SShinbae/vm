import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useCallback, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import expo-crop-image for mobile
let ImageEditor: any = null;
if (Platform.OS !== 'web') {
  try {
    const expoCropImage = require('expo-crop-image');
    ImageEditor = expoCropImage.ImageEditor;
  } catch (error) {
    console.warn('expo-crop-image not available:', error);
  }
}

// Only import react-dom createPortal on web
let createPortal: any = null;
if (Platform.OS === 'web') {
  try {
    const reactDom = require('react-dom');
    createPortal = reactDom.createPortal;
  } catch (error) {
    console.warn('react-dom not available', error);
  }
}

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCropComplete: (croppedImageUri: string) => void;
  onError: (error: string) => void;
  title?: string;
  description?: string;
  aspectRatio?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeHandle = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'right' | 'bottom' | 'left' | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete,
  onError,
  title = 'Crop Image',
  description = 'Drag to adjust the crop area.',
  aspectRatio = 1,
}) => {
  const [processing, setProcessing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // For mobile - use expo-crop-image
  if (Platform.OS !== 'web' && ImageEditor) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <ImageEditor
          imageUri={imageUri}
          fixedAspectRatio={aspectRatio}
          minimumCropDimensions={{
            width: 50,
            height: 50,
          }}
          onEditingCancel={onClose}
          onEditingComplete={async (result: { uri: string }) => {
            try {
              onCropComplete(result.uri);
              onClose();
            } catch (error: any) {
              console.error('Error completing crop:', error);
              onError(error.message || 'Failed to crop image');
            }
          }}
        />
      </Modal>
    );
  }

  // For web - use enhanced custom cropper
  return (
    <WebCropModal
      visible={visible}
      imageUri={imageUri}
      onClose={onClose}
      onCropComplete={onCropComplete}
      onError={onError}
      title={title}
      description={description}
      aspectRatio={aspectRatio}
      colors={colors}
      processing={processing}
      setProcessing={setProcessing}
    />
  );
};

// Web-specific crop modal component
const WebCropModal: React.FC<{
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCropComplete: (uri: string) => void;
  onError: (error: string) => void;
  title: string;
  description: string;
  aspectRatio: number;
  colors: any;
  processing: boolean;
  setProcessing: (val: boolean) => void;
}> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete,
  onError,
  title,
  description,
  aspectRatio,
  colors,
  processing,
  setProcessing,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle>(null);
  const pan = React.useRef(new Animated.ValueXY()).current;
  const imageRef = React.useRef<any>(null);

  // Initialize crop area when image loads
  const onImageLoad = useCallback(
    (event: any) => {
      let width, height;

      // Handle different event formats for web vs mobile
      if (Platform.OS === 'web') {
        // On web, try multiple methods to get dimensions
        console.log('Web onLoad event:', event);
        console.log('Image ref:', imageRef.current);

        // Method 1: Use the ref (most reliable on web)
        if (imageRef.current && typeof imageRef.current.naturalWidth !== 'undefined') {
          width = imageRef.current.naturalWidth;
          height = imageRef.current.naturalHeight;
          console.log('Got dimensions from ref.naturalWidth/Height');
        }
        // Method 2: Try event.target
        else if (event.target) {
          width = event.target.naturalWidth || event.target.width;
          height = event.target.naturalHeight || event.target.height;
          console.log('Got dimensions from event.target');
        }
        // Method 3: Try nativeEvent (might work in some cases)
        else if (event.nativeEvent?.target) {
          width = event.nativeEvent.target.naturalWidth || event.nativeEvent.target.width;
          height = event.nativeEvent.target.naturalHeight || event.nativeEvent.target.height;
          console.log('Got dimensions from event.nativeEvent.target');
        }
      } else {
        // On mobile, use event.nativeEvent
        if (event.nativeEvent) {
          const source = event.nativeEvent.source;
          width = source?.width;
          height = source?.height;
        }
      }

      console.log('Image loaded, dimensions:', { width, height, platform: Platform.OS });

      if (!width || !height || width === 0 || height === 0) {
        console.error('Invalid image dimensions:', { width, height });
        return;
      }

      setImageSize({ width, height });

      // Calculate initial crop area (80% of image, centered, maintaining aspect ratio)
      const cropSize = Math.min(width, height) * 0.8;
      const cropWidth = aspectRatio >= 1 ? cropSize : cropSize * aspectRatio;
      const cropHeight = aspectRatio >= 1 ? cropSize / aspectRatio : cropSize;

      const initialCropArea = {
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      };

      console.log('Initial crop area calculated:', initialCropArea);
      setCropArea(initialCropArea);
    },
    [aspectRatio]
  );

  // Web-specific mouse/touch handlers for dragging and resizing
  const [dragStart, setDragStart] = useState<{ x: number; y: number; cropX: number; cropY: number; cropWidth: number; cropHeight: number } | null>(null);

  const handleDragStart = (event: any) => {
    const clientX = event.clientX || event.nativeEvent?.clientX || (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY || event.nativeEvent?.clientY || (event.touches && event.touches[0]?.clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
      setIsDragging(true);
      setDragStart({ 
        x: clientX, 
        y: clientY, 
        cropX: cropArea.x, 
        cropY: cropArea.y, 
        cropWidth: cropArea.width, 
        cropHeight: cropArea.height 
      });
      if (event.preventDefault) event.preventDefault();
    }
  };

  const handleDragMove = React.useCallback((event: any) => {
    if (!isDragging || !dragStart) return;
    
    const clientX = event.clientX || event.nativeEvent?.clientX || (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY || event.nativeEvent?.clientY || (event.touches && event.touches[0]?.clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      
      // Calculate new position
      const newX = cropArea.x + deltaX;
      const newY = cropArea.y + deltaY;

      // Constrain to image bounds
      const constrainedX = Math.max(0, Math.min(newX, imageSize.width - cropArea.width));
      const constrainedY = Math.max(0, Math.min(newY, imageSize.height - cropArea.height));

      setCropArea((prev) => ({
        ...prev,
        x: constrainedX,
        y: constrainedY,
      }));
      
      setDragStart({ 
        x: clientX, 
        y: clientY, 
        cropX: constrainedX, 
        cropY: constrainedY, 
        cropWidth: cropArea.width, 
        cropHeight: cropArea.height 
      });
      if (event.preventDefault) event.preventDefault();
    }
  }, [isDragging, dragStart, cropArea, imageSize]);

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveResizeHandle(null);
    setDragStart(null);
  };

  // Handle resize start for corner and edge handles
  const handleResizeStart = (event: any, handle: ResizeHandle) => {
    const clientX = event.clientX || event.nativeEvent?.clientX || (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY || event.nativeEvent?.clientY || (event.touches && event.touches[0]?.clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
      setIsResizing(true);
      setActiveResizeHandle(handle);
      setDragStart({ 
        x: clientX, 
        y: clientY, 
        cropX: cropArea.x, 
        cropY: cropArea.y, 
        cropWidth: cropArea.width, 
        cropHeight: cropArea.height 
      });
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
    }
  };

  // Handle resize move
  const handleResizeMove = React.useCallback((event: any) => {
    if (!isResizing || !dragStart || !activeResizeHandle) return;
    
    const clientX = event.clientX || event.nativeEvent?.clientX || (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY || event.nativeEvent?.clientY || (event.touches && event.touches[0]?.clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      
      let newCropArea = { ...cropArea };
      
      // Handle different resize directions
      switch (activeResizeHandle) {
        case 'topLeft':
          newCropArea.x = Math.max(0, dragStart.cropX + deltaX);
          newCropArea.y = Math.max(0, dragStart.cropY + deltaY);
          newCropArea.width = Math.max(50, dragStart.cropWidth - deltaX);
          newCropArea.height = Math.max(50, dragStart.cropHeight - deltaY);
          break;
        case 'topRight':
          newCropArea.y = Math.max(0, dragStart.cropY + deltaY);
          newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
          newCropArea.height = Math.max(50, dragStart.cropHeight - deltaY);
          break;
        case 'bottomLeft':
          newCropArea.x = Math.max(0, dragStart.cropX + deltaX);
          newCropArea.width = Math.max(50, dragStart.cropWidth - deltaX);
          newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
          break;
        case 'bottomRight':
          newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
          newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
          break;
        case 'top':
          newCropArea.y = Math.max(0, dragStart.cropY + deltaY);
          newCropArea.height = Math.max(50, dragStart.cropHeight - deltaY);
          break;
        case 'bottom':
          newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
          break;
        case 'left':
          newCropArea.x = Math.max(0, dragStart.cropX + deltaX);
          newCropArea.width = Math.max(50, dragStart.cropWidth - deltaX);
          break;
        case 'right':
          newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
          break;
      }
      
      // Maintain aspect ratio if enabled
      if (aspectRatio && aspectRatio !== 0) {
        if (activeResizeHandle === 'topLeft' || activeResizeHandle === 'topRight' || 
            activeResizeHandle === 'bottomLeft' || activeResizeHandle === 'bottomRight') {
          const newHeight = newCropArea.width / aspectRatio;
          newCropArea.height = newHeight;
          
          // Adjust position if needed for top handles
          if (activeResizeHandle === 'topLeft' || activeResizeHandle === 'topRight') {
            newCropArea.y = Math.max(0, dragStart.cropY + dragStart.cropHeight - newHeight);
          }
        }
      }
      
      // Constrain to image bounds
      newCropArea.x = Math.max(0, Math.min(newCropArea.x, imageSize.width - newCropArea.width));
      newCropArea.y = Math.max(0, Math.min(newCropArea.y, imageSize.height - newCropArea.height));
      newCropArea.width = Math.min(newCropArea.width, imageSize.width - newCropArea.x);
      newCropArea.height = Math.min(newCropArea.height, imageSize.height - newCropArea.y);
      
      setCropArea(newCropArea);
      
      if (event.preventDefault) event.preventDefault();
    }
  }, [isResizing, dragStart, activeResizeHandle, cropArea, aspectRatio, imageSize]);

  // Add global event listeners for web dragging and resizing
  React.useEffect(() => {
    if (Platform.OS === 'web' && (isDragging || isResizing) && typeof document !== 'undefined') {
      const handlePointerMove = (e: PointerEvent) => {
        if (isResizing) {
          handleResizeMove(e);
        } else if (isDragging) {
          handleDragMove(e);
        }
      };
      const handlePointerUp = () => handleDragEnd();
      const handleMouseMove = (e: MouseEvent) => {
        if (isResizing) {
          handleResizeMove(e);
        } else if (isDragging) {
          handleDragMove(e);
        }
      };
      const handleMouseUp = () => handleDragEnd();

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleDragMove, handleResizeMove]);

  // Pan responder for mobile fallback
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web',
      onMoveShouldSetPanResponder: () => Platform.OS !== 'web',
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        // Calculate new position
        const newX = cropArea.x + gesture.dx;
        const newY = cropArea.y + gesture.dy;

        // Constrain to image bounds
        const constrainedX = Math.max(0, Math.min(newX, imageSize.width - cropArea.width));
        const constrainedY = Math.max(0, Math.min(newY, imageSize.height - cropArea.height));

        setCropArea((prev) => ({
          ...prev,
          x: constrainedX,
          y: constrainedY,
        }));
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        pan.flattenOffset();
      },
    })
  ).current;

  const handleSave = async () => {
    if (processing) return;

    if (!cropArea.width || !cropArea.height) {
      onError('Invalid crop area. Please try again.');
      return;
    }

    setProcessing(true);

    try {
      console.log('Cropping image with area:', cropArea);

      // Use Expo ImageManipulator to crop the image
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, Math.round(cropArea.x)),
              originY: Math.max(0, Math.round(cropArea.y)),
              width: Math.round(cropArea.width),
              height: Math.round(cropArea.height),
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log('Image cropped successfully:', result.uri);

      // On web, ImageManipulator returns a file:// URI that browsers can't access
      // We need to get the image data and create a proper blob URL
      if (Platform.OS === 'web') {
        try {
          // On web, get the base64 data by reading the result with base64 format
          const base64Result = await ImageManipulator.manipulateAsync(
            result.uri,
            [],
            {
              compress: 0.9,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );

          if (base64Result.base64) {
            // Convert base64 to blob
            const byteCharacters = atob(base64Result.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            // Create a blob URL that the browser can access
            const blobUrl = URL.createObjectURL(blob);
            console.log('Converted to blob URL:', blobUrl);
            onCropComplete(blobUrl);
          } else {
            throw new Error('Failed to get base64 data from ImageManipulator');
          }
        } catch (blobError: any) {
          console.error('Error converting to blob:', blobError);
          onError('Failed to process cropped image. Please try again.');
          return;
        }
      } else {
        // On native, use the URI directly
        onCropComplete(result.uri);
      }

      onClose();
    } catch (error: any) {
      console.error('Error cropping image:', error);
      onError(error.message || 'Failed to crop image');
    } finally {
      setProcessing(false);
    }
  };

  // Adjust crop size
  const adjustCropSize = (delta: number) => {
    setCropArea((prev) => {
      const newSize = Math.max(50, Math.min(imageSize.width, imageSize.height, prev.width + delta));
      const newWidth = aspectRatio >= 1 ? newSize : newSize * aspectRatio;
      const newHeight = aspectRatio >= 1 ? newSize / aspectRatio : newSize;

      // Keep centered
      return {
        ...prev,
        width: newWidth,
        height: newHeight,
        x: Math.max(0, Math.min(prev.x, imageSize.width - newWidth)),
        y: Math.max(0, Math.min(prev.y, imageSize.height - newHeight)),
      };
    });
  };

  if (!visible) return null;

  const modalContent = (
    <View style={[styles.overlay, Platform.OS === 'web' && styles.webOverlay]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={processing}>
            <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.description, { color: colors.icon }]}>{description}</Text>

        <View style={styles.imageContainer}>
          <Image
            ref={imageRef}
            source={{ uri: imageUri }}
            style={styles.image}
            onLoad={onImageLoad}
            resizeMode="contain"
          />

          {/* Dark overlay outside crop area */}
          {cropArea.width > 0 && (
            <View style={styles.overlayContainer} pointerEvents="none">
              {/* Top dark area */}
              <View
                style={[
                  styles.darkOverlay,
                  {
                    height: cropArea.y,
                    width: '100%',
                  },
                ]}
              />

              {/* Middle row with left, crop area, and right */}
              <View style={[styles.middleRow, { height: cropArea.height }]}>
                <View style={[styles.darkOverlay, { width: cropArea.x }]} />

                {/* Crop area with grid */}
                <View
                  style={{
                    width: cropArea.width,
                    height: cropArea.height,
                  }}
                >
                  {/* Rule of thirds grid */}
                  <View style={styles.gridContainer}>
                    {/* Vertical lines */}
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: cropArea.width / 3 }]} />
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: (cropArea.width * 2) / 3 }]} />
                    {/* Horizontal lines */}
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: cropArea.height / 3 }]} />
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: (cropArea.height * 2) / 3 }]} />
                  </View>

                  {/* Border */}
                  <View style={[styles.cropBorder, { borderColor: colors.tint }]} />

                  {/* Interactive corner handles */}
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'topLeft'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'topLeft'),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.topLeft,
                            borderColor: colors.tint,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'nw-resize',
                          } as any,
                        }
                      : {
                          style: [styles.cornerHandle, styles.topLeft, { borderColor: colors.tint }]
                        }
                    )}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'topRight'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'topRight'),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.topRight,
                            borderColor: colors.tint,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'ne-resize',
                          } as any,
                        }
                      : {
                          style: [styles.cornerHandle, styles.topRight, { borderColor: colors.tint }]
                        }
                    )}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'bottomLeft'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'bottomLeft'),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.bottomLeft,
                            borderColor: colors.tint,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'sw-resize',
                          } as any,
                        }
                      : {
                          style: [styles.cornerHandle, styles.bottomLeft, { borderColor: colors.tint }]
                        }
                    )}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'bottomRight'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'bottomRight'),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.bottomRight,
                            borderColor: colors.tint,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'se-resize',
                          } as any,
                        }
                      : {
                          style: [styles.cornerHandle, styles.bottomRight, { borderColor: colors.tint }]
                        }
                    )}
                  />

                  {/* Edge handles for better resizing */}
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'top'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'top'),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.topEdge,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'n-resize',
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.topEdge]
                        }
                    )}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'right'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'right'),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.rightEdge,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'e-resize',
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.rightEdge]
                        }
                    )}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'bottom'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'bottom'),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.bottomEdge,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 's-resize',
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.bottomEdge]
                        }
                    )}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === 'web' 
                      ? {
                          onPointerDown: (e: any) => handleResizeStart(e, 'left'),
                          onTouchStart: (e: any) => handleResizeStart(e, 'left'),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.leftEdge,
                            touchAction: 'none',
                            userSelect: 'none',
                            cursor: 'w-resize',
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.leftEdge]
                        }
                    )}
                  />
                </View>

                <View style={[styles.darkOverlay, { flex: 1 }]} />
              </View>

              {/* Bottom dark area */}
              <View style={[styles.darkOverlay, { flex: 1 }]} />
            </View>
          )}

          {/* Draggable overlay */}
          {cropArea.width > 0 && (
            <View
              style={[
                styles.draggableArea,
                {
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                },
              ]}
              {...(Platform.OS === 'web' 
                ? {
                    onPointerDown: handleDragStart,
                    onTouchStart: handleDragStart,
                    style: {
                      touchAction: 'none',
                      userSelect: 'none',
                    } as any,
                  }
                : panResponder.panHandlers
              )}
            />
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => adjustCropSize(-20)}
            style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
            disabled={processing}
          >
            <Text style={[styles.controlText, { color: colors.text }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>
            Drag to move • +/− to resize
          </Text>
          <TouchableOpacity
            onPress={() => adjustCropSize(20)}
            style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
            disabled={processing}
          >
            <Text style={[styles.controlText, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onClose}
            disabled={processing}
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: colors.border },
              processing && styles.disabledButton,
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>✕ Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={processing}
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: colors.tint },
              processing && styles.disabledButton,
            ]}
          >
            <Text style={[styles.buttonText, styles.saveButtonText]}>
              {processing ? '⏳ Processing...' : '✓ Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // On web, use portal if available
  if (Platform.OS === 'web' && createPortal && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  // Fallback
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {modalContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webOverlay: {
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2147483647,
        }
      : {}),
  },
  container: {
    borderRadius: 16,
    padding: 20,
    maxWidth: 600,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  middleRow: {
    flexDirection: 'row',
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  gridLineHorizontal: {
    height: 1,
    width: '100%',
  },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  cornerHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
    backgroundColor: 'white',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  draggableArea: {
    position: 'absolute',
    cursor: 'move' as any,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderStyle: 'dashed',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  controlLabel: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  saveButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Edge handle styles for resizing
  edgeHandle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
  },
  topEdge: {
    top: -3,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 6,
  },
  rightEdge: {
    right: -3,
    top: '50%',
    marginTop: -10,
    width: 6,
    height: 20,
  },
  bottomEdge: {
    bottom: -3,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 6,
  },
  leftEdge: {
    left: -3,
    top: '50%',
    marginTop: -10,
    width: 6,
    height: 20,
  },
});