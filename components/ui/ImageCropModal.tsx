import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useCallback, useState } from "react";
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
} from "react-native";

// Import react-native-image-crop-picker for mobile
let ImageCropPicker: any = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ImageCropPicker = require("react-native-image-crop-picker").default;
  } catch (error) {
    console.warn("react-native-image-crop-picker not available:", error);
  }
}

// Only import react-dom createPortal on web
let createPortal: any = null;
if (Platform.OS === "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reactDom = require("react-dom");
    createPortal = reactDom.createPortal;
  } catch (error) {
    console.warn("react-dom not available", error);
  }
}

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
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

type ResizeHandle =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "top"
  | "right"
  | "bottom"
  | "left"
  | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete,
  onError,
  title = "Crop Image",
  description = "Drag to adjust the crop area.",
  aspectRatio = 1,
}) => {
  const [processing, setProcessing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // For mobile - use react-native-image-crop-picker
  const isMobile = Platform.OS !== "web" && ImageCropPicker && visible;

  // Open crop picker immediately on mount (for mobile)
  React.useEffect(() => {
    if (!isMobile) return;

    const openCropPicker = async () => {
      try {
        console.log("📱 Opening mobile crop picker with image:", imageUri);

        const result = await ImageCropPicker.openCropper({
          path: imageUri,
          width: aspectRatio >= 1 ? 800 : 600,
          height: aspectRatio >= 1 ? 800 / aspectRatio : 600,
          cropping: true,
          cropperCircleOverlay: aspectRatio === 1,
          freeStyleCropEnabled: aspectRatio === 0,
          includeBase64: false,
          compressImageQuality: 0.9,
          mediaType: "photo",
          enableRotationGesture: true,
          avoidEmptySpaceAroundImage: true,
          cropperToolbarTitle: "Crop Image",
          cropperCancelText: "Cancel",
          cropperChooseText: "Choose",
        });

        console.log("📱 Mobile crop result:", result);

        // Convert URI to File object
        const response = await fetch(result.path);
        const blob = await response.blob();
        const fileName = `cropped_avatar_${Date.now()}.jpg`;
        const file = new File([blob], fileName, {
          type: result.mime || "image/jpeg",
        });

        console.log("✅ Mobile crop - Created File object:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        onCropComplete(file);
        onClose();
      } catch (error: any) {
        console.error("❌ Error completing mobile crop:", error);
        if (error.message !== "User cancelled image selection") {
          onError(error.message || "Failed to crop image");
        }
        onClose();
      }
    };

    openCropPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMobile) {
    return null; // Return null since the native picker handles its own UI
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
  onCropComplete: (file: File) => void;
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
  aspectRatio: initialAspectRatio,
  colors,
  processing,
  setProcessing,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeHandle, setActiveResizeHandle] =
    useState<ResizeHandle>(null);
  const pan = React.useRef(new Animated.ValueXY()).current;
  const imageRef = React.useRef<any>(null);

  // New state for advanced controls
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [originalImageUri] = useState(imageUri);

  // NEW HELPER FUNCTION: Extract crop area initialization
  const initializeCropArea = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      // Calculate displayed image dimensions considering resizeMode="contain"
      const containerWidth = 300;
      const containerHeight = 300;
      const imageAspectRatio = naturalWidth / naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight, offsetX, offsetY;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider - fit by width
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (containerHeight - displayHeight) / 2;
      } else {
        // Image is taller - fit by height
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        offsetX = (containerWidth - displayWidth) / 2;
        offsetY = 0;
      }

      console.log("✅ Display dimensions calculated:", {
        displayWidth,
        displayHeight,
        offsetX,
        offsetY,
      });

      setImageSize({ width: displayWidth, height: displayHeight });

      // Calculate initial crop area (70% of displayed image, centered)
      const cropSize = Math.min(displayWidth, displayHeight) * 0.7;
      const cropWidth = aspectRatio >= 1 ? cropSize : cropSize * aspectRatio;
      const cropHeight = aspectRatio >= 1 ? cropSize / aspectRatio : cropSize;

      const initialCropArea = {
        x: offsetX + (displayWidth - cropWidth) / 2,
        y: offsetY + (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      };

      console.log("✅ Initial crop area set:", initialCropArea);
      setCropArea(initialCropArea);
    },
    [aspectRatio],
  );

  // In ImageCropModal.tsx - Replace the onImageLoad function

  const onImageLoad = useCallback(
    (event: any) => {
      if (Platform.OS === "web") {
        // CRITICAL FIX: For web, access the underlying DOM element differently
        // React Native Image on web wraps an HTML img element
        let imgElement: HTMLImageElement | null = null;

        // Try to get the image element from the event first
        if (event?.target?.naturalWidth) {
          imgElement = event.target;
        } else if (event?.nativeEvent?.target?.naturalWidth) {
          imgElement = event.nativeEvent.target;
        } else if (imageRef.current) {
          // Fallback: Try to access through ref
          // On web, React Native Image renders to an img tag
          if ((imageRef.current as any).naturalWidth) {
            imgElement = imageRef.current as any;
          } else {
            // Last resort: query the DOM element directly
            const imgNode =
              (imageRef.current as any)._nativeTag || (imageRef.current as any);
            if (imgNode && imgNode.querySelector) {
              imgElement = imgNode.querySelector("img");
            } else if (imgNode && imgNode.tagName === "IMG") {
              imgElement = imgNode;
            }
          }
        }

        if (imgElement && imgElement.naturalWidth && imgElement.naturalHeight) {
          const naturalWidth = imgElement.naturalWidth;
          const naturalHeight = imgElement.naturalHeight;

          console.log("✅ Web image loaded:", {
            naturalWidth,
            naturalHeight,
          });

          if (naturalWidth > 0 && naturalHeight > 0) {
            initializeCropArea(naturalWidth, naturalHeight);
          } else {
            console.error("❌ Invalid image dimensions:", {
              naturalWidth,
              naturalHeight,
            });
          }
        } else {
          // If still can't get dimensions, create a new Image object
          console.warn("⚠️ Falling back to Image object method");
          const img = new window.Image();
          img.onload = () => {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;

            console.log("✅ Web image loaded (via Image object):", {
              naturalWidth,
              naturalHeight,
            });

            if (naturalWidth > 0 && naturalHeight > 0) {
              initializeCropArea(naturalWidth, naturalHeight);
            }
          };
          img.onerror = () => {
            console.error("❌ Failed to load image");
            onError("Failed to load image");
          };
          img.src = imageUri;
        }
      } else {
        // For mobile - unchanged
        if (event.nativeEvent?.source) {
          const source = event.nativeEvent.source;
          const naturalWidth = source.width;
          const naturalHeight = source.height;

          console.log("✅ Mobile image loaded:", {
            naturalWidth,
            naturalHeight,
          });

          if (naturalWidth && naturalHeight) {
            initializeCropArea(naturalWidth, naturalHeight);
          } else {
            console.error("❌ Invalid mobile image dimensions");
          }
        }
      }
    },
    [initializeCropArea, imageUri, onError],
  );

  // Web-specific mouse/touch handlers for dragging and resizing
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  } | null>(null);

  const handleDragStart = (event: any) => {
    const clientX =
      event.clientX ||
      event.nativeEvent?.clientX ||
      (event.touches && event.touches[0]?.clientX);
    const clientY =
      event.clientY ||
      event.nativeEvent?.clientY ||
      (event.touches && event.touches[0]?.clientY);

    if (clientX !== undefined && clientY !== undefined) {
      setIsDragging(true);
      setDragStart({
        x: clientX,
        y: clientY,
        cropX: cropArea.x,
        cropY: cropArea.y,
        cropWidth: cropArea.width,
        cropHeight: cropArea.height,
      });
      if (event.preventDefault) event.preventDefault();
    }
  };

  const handleDragMove = React.useCallback(
    (event: any) => {
      if (!isDragging || !dragStart) return;

      const clientX =
        event.clientX ||
        event.nativeEvent?.clientX ||
        (event.touches && event.touches[0]?.clientX);
      const clientY =
        event.clientY ||
        event.nativeEvent?.clientY ||
        (event.touches && event.touches[0]?.clientY);

      if (clientX !== undefined && clientY !== undefined) {
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;

        // Calculate new position
        const newX = dragStart.cropX + deltaX;
        const newY = dragStart.cropY + deltaY;

        // Get container bounds (300x300 from styles)
        const containerWidth = 300;
        const containerHeight = 300;

        // Calculate displayed image bounds considering resizeMode="contain"
        const imageAspectRatio = imageSize.width / imageSize.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight, offsetX, offsetY;
        if (imageAspectRatio > containerAspectRatio) {
          displayWidth = containerWidth;
          displayHeight = containerWidth / imageAspectRatio;
          offsetX = 0;
          offsetY = (containerHeight - displayHeight) / 2;
        } else {
          displayHeight = containerHeight;
          displayWidth = containerHeight * imageAspectRatio;
          offsetX = (containerWidth - displayWidth) / 2;
          offsetY = 0;
        }

        // Constrain to image bounds
        const constrainedX = Math.max(
          offsetX,
          Math.min(newX, offsetX + displayWidth - cropArea.width),
        );
        const constrainedY = Math.max(
          offsetY,
          Math.min(newY, offsetY + displayHeight - cropArea.height),
        );

        setCropArea((prev) => ({
          ...prev,
          x: constrainedX,
          y: constrainedY,
        }));

        if (event.preventDefault) event.preventDefault();
      }
    },
    [isDragging, dragStart, cropArea, imageSize],
  );

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveResizeHandle(null);
    setDragStart(null);
  };

  // Handle resize start for corner and edge handles
  const handleResizeStart = (event: any, handle: ResizeHandle) => {
    const clientX =
      event.clientX ||
      event.nativeEvent?.clientX ||
      (event.touches && event.touches[0]?.clientX);
    const clientY =
      event.clientY ||
      event.nativeEvent?.clientY ||
      (event.touches && event.touches[0]?.clientY);

    if (clientX !== undefined && clientY !== undefined) {
      setIsResizing(true);
      setActiveResizeHandle(handle);
      setDragStart({
        x: clientX,
        y: clientY,
        cropX: cropArea.x,
        cropY: cropArea.y,
        cropWidth: cropArea.width,
        cropHeight: cropArea.height,
      });
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
    }
  };

  // Handle resize move
  const handleResizeMove = React.useCallback(
    (event: any) => {
      if (!isResizing || !dragStart || !activeResizeHandle) return;

      const clientX =
        event.clientX ||
        event.nativeEvent?.clientX ||
        (event.touches && event.touches[0]?.clientX);
      const clientY =
        event.clientY ||
        event.nativeEvent?.clientY ||
        (event.touches && event.touches[0]?.clientY);

      if (clientX !== undefined && clientY !== undefined) {
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;

        // Get container bounds (300x300 from styles)
        const containerWidth = 300;
        const containerHeight = 300;

        // Calculate displayed image bounds considering resizeMode="contain"
        const imageAspectRatio = imageSize.width / imageSize.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight, offsetX, offsetY;
        if (imageAspectRatio > containerAspectRatio) {
          displayWidth = containerWidth;
          displayHeight = containerWidth / imageAspectRatio;
          offsetX = 0;
          offsetY = (containerHeight - displayHeight) / 2;
        } else {
          displayHeight = containerHeight;
          displayWidth = containerHeight * imageAspectRatio;
          offsetX = (containerWidth - displayWidth) / 2;
          offsetY = 0;
        }

        let newCropArea = { ...cropArea };

        // Handle different resize directions
        switch (activeResizeHandle) {
          case "topLeft":
            newCropArea.x = Math.max(offsetX, dragStart.cropX + deltaX);
            newCropArea.y = Math.max(offsetY, dragStart.cropY + deltaY);
            newCropArea.width = Math.max(50, dragStart.cropWidth - deltaX);
            newCropArea.height = Math.max(50, dragStart.cropHeight - deltaY);
            break;
          case "topRight":
            newCropArea.y = Math.max(offsetY, dragStart.cropY + deltaY);
            newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
            newCropArea.height = Math.max(50, dragStart.cropHeight - deltaY);
            break;
          case "bottomLeft":
            newCropArea.x = Math.max(offsetX, dragStart.cropX + deltaX);
            newCropArea.width = Math.max(50, dragStart.cropWidth - deltaX);
            newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
            break;
          case "bottomRight":
            newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
            newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
            break;
          case "top":
            newCropArea.y = Math.max(offsetY, dragStart.cropY + deltaY);
            newCropArea.height = Math.max(50, dragStart.cropHeight - deltaY);
            break;
          case "bottom":
            newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
            break;
          case "left":
            newCropArea.x = Math.max(offsetX, dragStart.cropX + deltaX);
            newCropArea.width = Math.max(50, dragStart.cropWidth - deltaX);
            break;
          case "right":
            newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
            break;
        }

        // Maintain aspect ratio if enabled
        if (aspectRatio && aspectRatio !== 0) {
          if (
            activeResizeHandle === "topLeft" ||
            activeResizeHandle === "topRight" ||
            activeResizeHandle === "bottomLeft" ||
            activeResizeHandle === "bottomRight"
          ) {
            const newHeight = newCropArea.width / aspectRatio;
            newCropArea.height = newHeight;

            // Adjust position if needed for top handles
            if (
              activeResizeHandle === "topLeft" ||
              activeResizeHandle === "topRight"
            ) {
              newCropArea.y = Math.max(
                offsetY,
                dragStart.cropY + dragStart.cropHeight - newHeight,
              );
            }
          }
        }

        // Constrain to image bounds
        newCropArea.x = Math.max(
          offsetX,
          Math.min(newCropArea.x, offsetX + displayWidth - newCropArea.width),
        );
        newCropArea.y = Math.max(
          offsetY,
          Math.min(newCropArea.y, offsetY + displayHeight - newCropArea.height),
        );
        newCropArea.width = Math.min(
          newCropArea.width,
          offsetX + displayWidth - newCropArea.x,
        );
        newCropArea.height = Math.min(
          newCropArea.height,
          offsetY + displayHeight - newCropArea.y,
        );

        setCropArea(newCropArea);

        if (event.preventDefault) event.preventDefault();
      }
    },
    [
      isResizing,
      dragStart,
      activeResizeHandle,
      cropArea,
      aspectRatio,
      imageSize,
    ],
  );

  // Add global event listeners for web dragging and resizing
  React.useEffect(() => {
    if (
      Platform.OS === "web" &&
      (isDragging || isResizing) &&
      typeof document !== "undefined"
    ) {
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

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleDragMove, handleResizeMove]);

  // Pan responder for mobile fallback
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== "web",
      onMoveShouldSetPanResponder: () => Platform.OS !== "web",
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        // Calculate new position
        const newX = cropArea.x + gesture.dx;
        const newY = cropArea.y + gesture.dy;

        // Constrain to image bounds
        const constrainedX = Math.max(
          0,
          Math.min(newX, imageSize.width - cropArea.width),
        );
        const constrainedY = Math.max(
          0,
          Math.min(newY, imageSize.height - cropArea.height),
        );

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
    }),
  ).current;

  const handleSave = async () => {
    if (processing) return;

    if (!cropArea.width || !cropArea.height) {
      onError("Invalid crop area. Please try again.");
      return;
    }

    setProcessing(true);

    try {
      console.log("Cropping image with displayed area:", cropArea);

      // CRITICAL FIX: Get the actual natural image dimensions
      let originalWidth: number;
      let originalHeight: number;

      if (Platform.OS === "web") {
        // For web, we need to create a new Image object to get natural dimensions
        const img = new window.Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUri;
        });
        originalWidth = img.naturalWidth;
        originalHeight = img.naturalHeight;
      } else {
        // For mobile, use Image.getSize
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve, reject) => {
            Image.getSize(
              imageUri,
              (width, height) => {
                resolve({ width, height });
              },
              reject,
            );
          },
        );
        originalWidth = dimensions.width;
        originalHeight = dimensions.height;
      }

      console.log("✅ Original image dimensions:", {
        originalWidth,
        originalHeight,
      });

      // Get container bounds (300x300 from styles)
      const containerWidth = 300;
      const containerHeight = 300;

      // Calculate how the image is actually displayed (considering contain mode)
      const imageAspectRatio = originalWidth / originalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight, offsetX, offsetY;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider - fits by width
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (containerHeight - displayHeight) / 2;
      } else {
        // Image is taller - fits by height
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        offsetX = (containerWidth - displayWidth) / 2;
        offsetY = 0;
      }

      console.log("Display dimensions:", {
        displayWidth,
        displayHeight,
        offsetX,
        offsetY,
      });

      // CRITICAL FIX: Calculate scale from DISPLAY to ORIGINAL
      const scaleX = originalWidth / displayWidth;
      const scaleY = originalHeight / displayHeight;

      console.log("Scale factors:", { scaleX, scaleY });

      // Convert crop area from display coordinates to original image coordinates
      const originalCropArea = {
        originX: Math.max(0, Math.round((cropArea.x - offsetX) * scaleX)),
        originY: Math.max(0, Math.round((cropArea.y - offsetY) * scaleY)),
        width: Math.min(Math.round(cropArea.width * scaleX), originalWidth),
        height: Math.min(Math.round(cropArea.height * scaleY), originalHeight),
      };

      // CRITICAL FIX: Ensure crop area is within bounds
      if (originalCropArea.originX + originalCropArea.width > originalWidth) {
        originalCropArea.width = originalWidth - originalCropArea.originX;
      }
      if (originalCropArea.originY + originalCropArea.height > originalHeight) {
        originalCropArea.height = originalHeight - originalCropArea.originY;
      }

      console.log(
        "✅ Final crop area (original coordinates):",
        originalCropArea,
      );

      // Validate crop area
      if (
        originalCropArea.width <= 0 ||
        originalCropArea.height <= 0 ||
        originalCropArea.originX < 0 ||
        originalCropArea.originY < 0
      ) {
        throw new Error("Invalid crop coordinates calculated");
      }

      // Build manipulation actions array
      const actions: any[] = [];

      // Apply crop first
      actions.push({ crop: originalCropArea });

      // Then apply rotation if needed
      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      // Apply flip transformations last
      if (flipHorizontal) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
      if (flipVertical) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }

      // Use Expo ImageManipulator to apply all transformations
      const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      console.log("✅ Image cropped successfully:", result.uri);

      // Convert to File object for upload
      if (Platform.OS === "web") {
        // For web, fetch the result and create a proper File
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const fileName = `cropped_avatar_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });

        console.log("✅ Created File object for web:", file);
        onCropComplete(file);
      } else {
        // For mobile, convert URI to File
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const fileName = `cropped_avatar_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });

        console.log("✅ Created File object for mobile:", file);
        onCropComplete(file);
      }

      onClose();
    } catch (error: any) {
      console.error("Error cropping image:", error);
      onError(error.message || "Failed to crop image");
    } finally {
      setProcessing(false);
    }
  };

  // Handle rotation
  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  // Handle flip
  const handleFlipHorizontal = () => {
    setFlipHorizontal((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setFlipVertical((prev) => !prev);
  };

  // Handle aspect ratio change
  const handleAspectRatioChange = (newRatio: number) => {
    setAspectRatio(newRatio);
    // Recalculate crop area to match new aspect ratio
    setCropArea((prev) => {
      const containerWidth = 300;
      const containerHeight = 300;
      const imageAspectRatio = imageSize.width / imageSize.height;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight, offsetX, offsetY;
      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (containerHeight - displayHeight) / 2;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        offsetX = (containerWidth - displayWidth) / 2;
        offsetY = 0;
      }

      const cropSize = Math.min(displayWidth, displayHeight) * 0.7;
      const newWidth =
        newRatio === 0
          ? cropSize
          : newRatio >= 1
            ? cropSize
            : cropSize * newRatio;
      const newHeight =
        newRatio === 0
          ? cropSize
          : newRatio >= 1
            ? cropSize / newRatio
            : cropSize;

      return {
        x: offsetX + (displayWidth - newWidth) / 2,
        y: offsetY + (displayHeight - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  // Reset all transformations
  const handleReset = () => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setAspectRatio(initialAspectRatio);
    // Reinitialize crop area
    if (imageSize.width > 0 && imageSize.height > 0) {
      initializeCropArea(imageSize.width, imageSize.height);
    }
  };

  // Adjust crop size
  const adjustCropSize = (delta: number) => {
    setCropArea((prev) => {
      // Get container bounds (300x300 from styles)
      const containerWidth = 300;
      const containerHeight = 300;

      // Calculate displayed image bounds considering resizeMode="contain"
      const imageAspectRatio = imageSize.width / imageSize.height;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight, offsetX, offsetY;
      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (containerHeight - displayHeight) / 2;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        offsetX = (containerWidth - displayWidth) / 2;
        offsetY = 0;
      }

      const newSize = Math.max(
        50,
        Math.min(displayWidth, displayHeight, prev.width + delta),
      );
      const newWidth = aspectRatio >= 1 ? newSize : newSize * aspectRatio;
      const newHeight = aspectRatio >= 1 ? newSize / aspectRatio : newSize;

      // Keep centered within image bounds
      return {
        ...prev,
        width: newWidth,
        height: newHeight,
        x: Math.max(
          offsetX,
          Math.min(prev.x, offsetX + displayWidth - newWidth),
        ),
        y: Math.max(
          offsetY,
          Math.min(prev.y, offsetY + displayHeight - newHeight),
        ),
      };
    });
  };

  if (!visible) return null;

  const modalContent = (
    <View style={[styles.overlay, Platform.OS === "web" && styles.webOverlay]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            disabled={processing}
          >
            <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.description, { color: colors.icon }]}>
          {description}
        </Text>

        {/* Transformation Preview Info */}
        {(rotation !== 0 || flipHorizontal || flipVertical) && (
          <View style={styles.transformInfo}>
            <Text style={[styles.transformInfoText, { color: colors.text }]}>
              Transformations:
              {rotation !== 0 && ` Rotate ${rotation}°`}
              {flipHorizontal && ` Flip-H`}
              {flipVertical && ` Flip-V`}
              {" (applied on save)"}
            </Text>
          </View>
        )}

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
                    width: "100%",
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
                    <View
                      style={[
                        styles.gridLine,
                        styles.gridLineVertical,
                        { left: cropArea.width / 3 },
                      ]}
                    />
                    <View
                      style={[
                        styles.gridLine,
                        styles.gridLineVertical,
                        { left: (cropArea.width * 2) / 3 },
                      ]}
                    />
                    {/* Horizontal lines */}
                    <View
                      style={[
                        styles.gridLine,
                        styles.gridLineHorizontal,
                        { top: cropArea.height / 3 },
                      ]}
                    />
                    <View
                      style={[
                        styles.gridLine,
                        styles.gridLineHorizontal,
                        { top: (cropArea.height * 2) / 3 },
                      ]}
                    />
                  </View>

                  {/* Border */}
                  <View
                    style={[styles.cropBorder, { borderColor: colors.tint }]}
                  />

                  {/* Interactive corner handles */}
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "topLeft"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "topLeft"),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.topLeft,
                            borderColor: colors.tint,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "nw-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [
                            styles.cornerHandle,
                            styles.topLeft,
                            { borderColor: colors.tint },
                          ],
                        })}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "topRight"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "topRight"),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.topRight,
                            borderColor: colors.tint,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "ne-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [
                            styles.cornerHandle,
                            styles.topRight,
                            { borderColor: colors.tint },
                          ],
                        })}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "bottomLeft"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "bottomLeft"),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.bottomLeft,
                            borderColor: colors.tint,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "sw-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [
                            styles.cornerHandle,
                            styles.bottomLeft,
                            { borderColor: colors.tint },
                          ],
                        })}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "bottomRight"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "bottomRight"),
                          style: {
                            ...styles.cornerHandle,
                            ...styles.bottomRight,
                            borderColor: colors.tint,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "se-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [
                            styles.cornerHandle,
                            styles.bottomRight,
                            { borderColor: colors.tint },
                          ],
                        })}
                  />

                  {/* Edge handles for better resizing */}
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "top"),
                          onTouchStart: (e: any) => handleResizeStart(e, "top"),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.topEdge,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "n-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.topEdge],
                        })}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "right"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "right"),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.rightEdge,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "e-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.rightEdge],
                        })}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "bottom"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "bottom"),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.bottomEdge,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "s-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.bottomEdge],
                        })}
                  />
                  <TouchableOpacity
                    {...(Platform.OS === "web"
                      ? {
                          onPointerDown: (e: any) =>
                            handleResizeStart(e, "left"),
                          onTouchStart: (e: any) =>
                            handleResizeStart(e, "left"),
                          style: {
                            ...styles.edgeHandle,
                            ...styles.leftEdge,
                            touchAction: "none",
                            userSelect: "none",
                            cursor: "w-resize",
                            zIndex: 10, // Above draggable area
                          } as any,
                        }
                      : {
                          style: [styles.edgeHandle, styles.leftEdge],
                        })}
                  />
                </View>

                <View style={[styles.darkOverlay, { flex: 1 }]} />
              </View>

              {/* Bottom dark area */}
              <View style={[styles.darkOverlay, { flex: 1 }]} />
            </View>
          )}

          {/* Draggable overlay - captures drag events on the crop border */}
          {cropArea.width > 0 && Platform.OS === "web" && (
            <div
              style={{
                position: "absolute",
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                cursor: "move",
                zIndex: 5,
                touchAction: "none",
                userSelect: "none",
              }}
              onPointerDown={handleDragStart}
              onTouchStart={handleDragStart}
            />
          )}
        </View>

        {/* Zoom Controls - Removed for alignment, use resize handles and +/- buttons instead */}

        {/* Rotation & Flip Controls */}
        <View style={styles.controlSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Transform
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => handleRotate(-90)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              disabled={processing}
            >
              <Text style={[styles.iconButtonText, { color: colors.text }]}>
                ↺ 90°
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRotate(90)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              disabled={processing}
            >
              <Text style={[styles.iconButtonText, { color: colors.text }]}>
                ↻ 90°
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRotate(180)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              disabled={processing}
            >
              <Text style={[styles.iconButtonText, { color: colors.text }]}>
                ↻ 180°
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFlipHorizontal}
              style={[
                styles.iconButton,
                {
                  backgroundColor: flipHorizontal
                    ? colors.tint
                    : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.iconButtonText,
                  { color: flipHorizontal ? "white" : colors.text },
                ]}
              >
                ⇄
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFlipVertical}
              style={[
                styles.iconButton,
                {
                  backgroundColor: flipVertical
                    ? colors.tint
                    : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.iconButtonText,
                  { color: flipVertical ? "white" : colors.text },
                ]}
              >
                ⇅
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Aspect Ratio Controls */}
        <View style={styles.controlSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Aspect Ratio
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => handleAspectRatioChange(1)}
              style={[
                styles.aspectButton,
                {
                  backgroundColor:
                    aspectRatio === 1
                      ? colors.tint
                      : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.aspectButtonText,
                  { color: aspectRatio === 1 ? "white" : colors.text },
                ]}
              >
                1:1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAspectRatioChange(4 / 3)}
              style={[
                styles.aspectButton,
                {
                  backgroundColor:
                    Math.abs(aspectRatio - 4 / 3) < 0.01
                      ? colors.tint
                      : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.aspectButtonText,
                  {
                    color:
                      Math.abs(aspectRatio - 4 / 3) < 0.01
                        ? "white"
                        : colors.text,
                  },
                ]}
              >
                4:3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAspectRatioChange(16 / 9)}
              style={[
                styles.aspectButton,
                {
                  backgroundColor:
                    Math.abs(aspectRatio - 16 / 9) < 0.01
                      ? colors.tint
                      : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.aspectButtonText,
                  {
                    color:
                      Math.abs(aspectRatio - 16 / 9) < 0.01
                        ? "white"
                        : colors.text,
                  },
                ]}
              >
                16:9
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAspectRatioChange(0)}
              style={[
                styles.aspectButton,
                {
                  backgroundColor:
                    aspectRatio === 0
                      ? colors.tint
                      : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.aspectButtonText,
                  { color: aspectRatio === 0 ? "white" : colors.text },
                ]}
              >
                Free
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Original Controls (Resize) */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => adjustCropSize(-20)}
            style={[
              styles.controlButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            disabled={processing}
          >
            <Text style={[styles.controlText, { color: colors.text }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>
            Drag to move • +/− to resize
          </Text>
          <TouchableOpacity
            onPress={() => adjustCropSize(20)}
            style={[
              styles.controlButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
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
            <Text style={[styles.buttonText, { color: colors.text }]}>
              ✕ Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReset}
            disabled={processing}
            style={[
              styles.button,
              styles.resetButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              },
              processing && styles.disabledButton,
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              ↺ Reset
            </Text>
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
              {processing ? "⏳ Processing..." : "✓ Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // On web, use portal if available
  if (
    Platform.OS === "web" &&
    createPortal &&
    typeof document !== "undefined"
  ) {
    return createPortal(modalContent, document.body);
  }

  // Fallback
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {modalContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  webOverlay: {
    ...(Platform.OS === "web"
      ? {
          position: "fixed" as any,
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
    width: "100%",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  transformInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: "center",
  },
  transformInfoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
    marginBottom: 16,
    overflow: "hidden",
    borderRadius: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  middleRow: {
    flexDirection: "row",
  },
  darkOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  gridLineVertical: {
    width: 1,
    height: "100%",
  },
  gridLineHorizontal: {
    height: 1,
    width: "100%",
  },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderStyle: "solid",
  },
  cornerHandle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 3,
    backgroundColor: "white",
    zIndex: 10, // Ensure handles are above draggable area
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
    position: "absolute",
    backgroundColor: "transparent", // Invisible but still captures events
    // Remove borders that were interfering with resize handles
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  controlLabel: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  saveButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButton: {
    borderWidth: 1,
  },
  // New control section styles
  controlSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  aspectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  aspectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Edge handle styles for resizing
  edgeHandle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 3,
    zIndex: 10, // Ensure handles are above draggable area
  },
  topEdge: {
    top: -3,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 6,
  },
  rightEdge: {
    right: -3,
    top: "50%",
    marginTop: -10,
    width: 6,
    height: 20,
  },
  bottomEdge: {
    bottom: -3,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 6,
  },
  leftEdge: {
    left: -3,
    top: "50%",
    marginTop: -10,
    width: 6,
    height: 20,
  },
});
