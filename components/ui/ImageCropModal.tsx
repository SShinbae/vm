import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";
import {
  withOpacity,
  type ThemeColors,
  baseColors,
  spacing,
} from "@/src/design-system";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";

// Constants
const CONTAINER_WIDTH = 500;
const CONTAINER_HEIGHT = 350;
const MIN_CROP_SIZE = 50;
const HANDLE_SIZE = 15;
const HANDLE_RENDER_SIZE = 10;

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
let createPortal:
  | ((children: React.ReactNode, container: Element) => React.ReactPortal)
  | null = null;
if (Platform.OS === "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reactDom = require("react-dom");
    createPortal = reactDom.createPortal;
  } catch (error) {
    console.warn("react-dom not available", error);
  }
}

// Types
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DisplayDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | null;

// Helper function to calculate display dimensions
const calculateDisplayDimensions = (
  imgWidth: number,
  imgHeight: number,
): DisplayDimensions => {
  const imgAspect = imgWidth / imgHeight;
  const containerAspect = CONTAINER_WIDTH / CONTAINER_HEIGHT;

  if (imgAspect > containerAspect) {
    const width = CONTAINER_WIDTH;
    const height = CONTAINER_WIDTH / imgAspect;
    return {
      width,
      height,
      x: 0,
      y: (CONTAINER_HEIGHT - height) / 2,
    };
  }
  const height = CONTAINER_HEIGHT;
  const width = CONTAINER_HEIGHT * imgAspect;
  return {
    width,
    height,
    x: (CONTAINER_WIDTH - width) / 2,
    y: 0,
  };
};

// Helper function to calculate initial crop area
const calculateInitialCropArea = (
  displayWidth: number,
  displayHeight: number,
  aspectRatio: number | undefined,
): CropArea => {
  const cropSize = Math.min(displayWidth, displayHeight) * 0.8;
  let cropW = cropSize;
  let cropH = aspectRatio ? cropSize / aspectRatio : cropSize;

  if (cropH > displayHeight * 0.8) {
    cropH = displayHeight * 0.8;
    cropW = aspectRatio ? cropH * aspectRatio : cropH;
  }

  return {
    x: (CONTAINER_WIDTH - cropW) / 2,
    y: (CONTAINER_HEIGHT - cropH) / 2,
    width: cropW,
    height: cropH,
  };
};

// Throttle utility
const throttle = <T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

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

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete,
  onError,
  title = "Crop Image",
  description = "Drag to adjust the crop area.",
  aspectRatio = undefined,
}) => {
  const [processing, setProcessing] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;

  // For mobile - use react-native-image-crop-picker
  const isMobile = Platform.OS !== "web" && ImageCropPicker && visible;

  // Open crop picker immediately on mount (for mobile)
  React.useEffect(() => {
    if (!isMobile) return;

    const openCropPicker = async () => {
      try {
        const effectiveAspectRatio =
          aspectRatio === undefined ? 0 : aspectRatio;
        const result = await ImageCropPicker.openCropper({
          path: imageUri,
          width: effectiveAspectRatio >= 1 ? 800 : 600,
          height: effectiveAspectRatio >= 1 ? 800 / effectiveAspectRatio : 600,
          cropping: true,
          cropperCircleOverlay: effectiveAspectRatio === 1,
          freeStyleCropEnabled: effectiveAspectRatio === 0,
          includeBase64: false,
          compressImageQuality: 0.9,
          mediaType: "photo",
          enableRotationGesture: true,
          avoidEmptySpaceAroundImage: true,
          cropperToolbarTitle: "Crop Image",
          cropperCancelText: "Cancel",
          cropperChooseText: "Choose",
        });

        const response = await fetch(result.path);
        const blob = await response.blob();
        const fileName = `cropped_${Date.now()}.jpg`;
        const file = new File([blob], fileName, {
          type: result.mime || "image/jpeg",
        });

        onCropComplete(file);
        onClose();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (errorMessage !== "User cancelled image selection") {
          onError(errorMessage || "Failed to crop image");
        }
        onClose();
      }
    };

    openCropPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMobile) {
    return null;
  }

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

// Simple canvas-based web crop modal
interface WebCropModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCropComplete: (file: File) => void;
  onError: (error: string) => void;
  title: string;
  description: string;
  aspectRatio: number | undefined;
  colors: ThemeColors;
  processing: boolean;
  setProcessing: (val: boolean) => void;
}

const WebCropModal: React.FC<WebCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete: onComplete,
  onError,
  title,
  description,
  aspectRatio: initialAspectRatio,
  colors,
  processing,
  setProcessing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(
    initialAspectRatio === 0 || initialAspectRatio === undefined
      ? undefined
      : initialAspectRatio,
  );

  // Crop area state
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Load image
  useEffect(() => {
    if (Platform.OS === "web" && imageUri && visible) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        setImageLoaded(true);

        const display = calculateDisplayDimensions(img.width, img.height);
        const initialCrop = calculateInitialCropArea(
          display.width,
          display.height,
          aspectRatio,
        );
        setCropArea(initialCrop);
      };
      img.onerror = () => {
        onError("Failed to load image for cropping");
      };
      img.src = imageUri;
    }
  }, [imageUri, visible, aspectRatio, onError]);

  // Draw canvas with requestAnimationFrame
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    canvas.width = CONTAINER_WIDTH;
    canvas.height = CONTAINER_HEIGHT;

    // Clear canvas
    ctx.fillStyle = baseColors.black;
    ctx.fillRect(0, 0, CONTAINER_WIDTH, CONTAINER_HEIGHT);

    // Calculate image position
    const display = calculateDisplayDimensions(image.width, image.height);

    // Save context for rotation
    ctx.save();

    // Apply rotation around center
    if (rotation !== 0) {
      ctx.translate(CONTAINER_WIDTH / 2, CONTAINER_HEIGHT / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-CONTAINER_WIDTH / 2, -CONTAINER_HEIGHT / 2);
    }

    // Draw image
    ctx.drawImage(image, display.x, display.y, display.width, display.height);
    ctx.restore();

    // Draw darkened overlay
    ctx.fillStyle = withOpacity(baseColors.black, 0.5);
    ctx.fillRect(0, 0, CONTAINER_WIDTH, CONTAINER_HEIGHT);

    // Clear crop area (show original image)
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(CONTAINER_WIDTH / 2, CONTAINER_HEIGHT / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-CONTAINER_WIDTH / 2, -CONTAINER_HEIGHT / 2);
    }

    // Create clipping region for crop area
    ctx.beginPath();
    ctx.rect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.clip();

    // Redraw image in crop area
    ctx.drawImage(image, display.x, display.y, display.width, display.height);
    ctx.restore();

    // Draw crop border
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = withOpacity(colors.white, 0.3);
    ctx.lineWidth = 1;
    const thirdW = cropArea.width / 3;
    const thirdH = cropArea.height / 3;
    ctx.beginPath();
    ctx.moveTo(cropArea.x + thirdW, cropArea.y);
    ctx.lineTo(cropArea.x + thirdW, cropArea.y + cropArea.height);
    ctx.moveTo(cropArea.x + thirdW * 2, cropArea.y);
    ctx.lineTo(cropArea.x + thirdW * 2, cropArea.y + cropArea.height);
    ctx.moveTo(cropArea.x, cropArea.y + thirdH);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + thirdH);
    ctx.moveTo(cropArea.x, cropArea.y + thirdH * 2);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + thirdH * 2);
    ctx.stroke();

    // Draw corner handles
    ctx.fillStyle = colors.white;
    const halfHandle = HANDLE_RENDER_SIZE / 2;
    // Top-left
    ctx.fillRect(
      cropArea.x - halfHandle,
      cropArea.y - halfHandle,
      HANDLE_RENDER_SIZE,
      HANDLE_RENDER_SIZE,
    );
    // Top-right
    ctx.fillRect(
      cropArea.x + cropArea.width - halfHandle,
      cropArea.y - halfHandle,
      HANDLE_RENDER_SIZE,
      HANDLE_RENDER_SIZE,
    );
    // Bottom-left
    ctx.fillRect(
      cropArea.x - halfHandle,
      cropArea.y + cropArea.height - halfHandle,
      HANDLE_RENDER_SIZE,
      HANDLE_RENDER_SIZE,
    );
    // Bottom-right
    ctx.fillRect(
      cropArea.x + cropArea.width - halfHandle,
      cropArea.y + cropArea.height - halfHandle,
      HANDLE_RENDER_SIZE,
      HANDLE_RENDER_SIZE,
    );
  }, [image, cropArea, rotation, colors.white]);

  // Use RAF for canvas updates
  useEffect(() => {
    if (imageLoaded) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawCanvas);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [imageLoaded, drawCanvas]);

  // Get position from mouse or touch event
  const getEventPos = useCallback(
    (clientX: number, clientY: number): Position => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = CONTAINER_WIDTH / rect.width;
      const scaleY = CONTAINER_HEIGHT / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const getResizeHandle = useCallback(
    (x: number, y: number): ResizeHandle => {
      const { x: cx, y: cy, width: cw, height: ch } = cropArea;

      if (Math.abs(x - cx) < HANDLE_SIZE && Math.abs(y - cy) < HANDLE_SIZE)
        return "nw";
      if (
        Math.abs(x - (cx + cw)) < HANDLE_SIZE &&
        Math.abs(y - cy) < HANDLE_SIZE
      )
        return "ne";
      if (
        Math.abs(x - cx) < HANDLE_SIZE &&
        Math.abs(y - (cy + ch)) < HANDLE_SIZE
      )
        return "sw";
      if (
        Math.abs(x - (cx + cw)) < HANDLE_SIZE &&
        Math.abs(y - (cy + ch)) < HANDLE_SIZE
      )
        return "se";
      return null;
    },
    [cropArea],
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      const pos = getEventPos(clientX, clientY);
      const handle = getResizeHandle(pos.x, pos.y);

      if (handle) {
        setIsResizing(handle);
        setDragStart(pos);
      } else if (
        pos.x >= cropArea.x &&
        pos.x <= cropArea.x + cropArea.width &&
        pos.y >= cropArea.y &&
        pos.y <= cropArea.y + cropArea.height
      ) {
        setIsDragging(true);
        setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y });
      }
    },
    [getEventPos, getResizeHandle, cropArea],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const pos = getEventPos(clientX, clientY);

      if (isDragging) {
        let newX = pos.x - dragStart.x;
        let newY = pos.y - dragStart.y;

        // Constrain to canvas bounds
        newX = Math.max(0, Math.min(newX, CONTAINER_WIDTH - cropArea.width));
        newY = Math.max(0, Math.min(newY, CONTAINER_HEIGHT - cropArea.height));

        setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        let newCrop = { ...cropArea };

        switch (isResizing) {
          case "nw":
            newCrop.x = Math.min(
              pos.x,
              cropArea.x + cropArea.width - MIN_CROP_SIZE,
            );
            newCrop.y = Math.min(
              pos.y,
              cropArea.y + cropArea.height - MIN_CROP_SIZE,
            );
            newCrop.width = cropArea.x + cropArea.width - newCrop.x;
            newCrop.height = cropArea.y + cropArea.height - newCrop.y;
            break;
          case "ne":
            newCrop.y = Math.min(
              pos.y,
              cropArea.y + cropArea.height - MIN_CROP_SIZE,
            );
            newCrop.width = Math.max(MIN_CROP_SIZE, pos.x - cropArea.x);
            newCrop.height = cropArea.y + cropArea.height - newCrop.y;
            break;
          case "sw":
            newCrop.x = Math.min(
              pos.x,
              cropArea.x + cropArea.width - MIN_CROP_SIZE,
            );
            newCrop.width = cropArea.x + cropArea.width - newCrop.x;
            newCrop.height = Math.max(MIN_CROP_SIZE, pos.y - cropArea.y);
            break;
          case "se":
            newCrop.width = Math.max(MIN_CROP_SIZE, pos.x - cropArea.x);
            newCrop.height = Math.max(MIN_CROP_SIZE, pos.y - cropArea.y);
            break;
        }

        // Apply aspect ratio constraint
        if (aspectRatio) {
          if (isResizing.includes("e") || isResizing.includes("w")) {
            newCrop.height = newCrop.width / aspectRatio;
          } else {
            newCrop.width = newCrop.height * aspectRatio;
          }
        }

        // Constrain to bounds
        newCrop.x = Math.max(0, newCrop.x);
        newCrop.y = Math.max(0, newCrop.y);
        newCrop.width = Math.min(newCrop.width, CONTAINER_WIDTH - newCrop.x);
        newCrop.height = Math.min(newCrop.height, CONTAINER_HEIGHT - newCrop.y);

        setCropArea(newCrop);
        setDragStart(pos);
      } else {
        // Update cursor
        const handle = getResizeHandle(pos.x, pos.y);
        const canvas = canvasRef.current;
        if (canvas) {
          if (handle === "nw" || handle === "se") {
            canvas.style.cursor = "nwse-resize";
          } else if (handle === "ne" || handle === "sw") {
            canvas.style.cursor = "nesw-resize";
          } else if (
            pos.x >= cropArea.x &&
            pos.x <= cropArea.x + cropArea.width &&
            pos.y >= cropArea.y &&
            pos.y <= cropArea.y + cropArea.height
          ) {
            canvas.style.cursor = "move";
          } else {
            canvas.style.cursor = "default";
          }
        }
      }
    },
    [
      getEventPos,
      getResizeHandle,
      isDragging,
      isResizing,
      dragStart,
      cropArea,
      aspectRatio,
    ],
  );

  // Throttled version for performance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledPointerMove = useCallback(
    throttle((clientX: number, clientY: number) => {
      handlePointerMove(clientX, clientY);
    }, 16), // ~60fps
    [handlePointerMove],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) =>
    handlePointerDown(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) =>
    throttledPointerMove(e.clientX, e.clientY);
  const handleMouseUp = () => handlePointerUp();

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) handlePointerDown(touch.clientX, touch.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) throttledPointerMove(touch.clientX, touch.clientY);
  };
  const handleTouchEnd = () => handlePointerUp();

  const handleSave = async () => {
    if (processing || !image) return;

    setProcessing(true);
    try {
      const display = calculateDisplayDimensions(image.width, image.height);

      // Convert crop area to original image coordinates
      const scaleX = image.width / display.width;
      const scaleY = image.height / display.height;

      const srcX = (cropArea.x - display.x) * scaleX;
      const srcY = (cropArea.y - display.y) * scaleY;
      const srcW = cropArea.width * scaleX;
      const srcH = cropArea.height * scaleY;

      // Create output canvas
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = srcW;
      outputCanvas.height = srcH;
      const outputCtx = outputCanvas.getContext("2d");

      if (!outputCtx) throw new Error("Could not get canvas context");

      // Apply rotation if needed
      if (rotation !== 0) {
        outputCtx.translate(srcW / 2, srcH / 2);
        outputCtx.rotate((rotation * Math.PI) / 180);
        outputCtx.translate(-srcW / 2, -srcH / 2);
      }

      // Draw cropped image
      outputCtx.drawImage(
        image,
        Math.max(0, srcX),
        Math.max(0, srcY),
        Math.min(srcW, image.width - srcX),
        Math.min(srcH, image.height - srcY),
        0,
        0,
        srcW,
        srcH,
      );

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.9,
        );
      });

      const file = new File([blob], `cropped_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      onComplete(file);
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to crop image";
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setAspectRatio(
      initialAspectRatio === 0 || initialAspectRatio === undefined
        ? undefined
        : initialAspectRatio,
    );
    if (image) {
      const display = calculateDisplayDimensions(image.width, image.height);
      const initialCrop = calculateInitialCropArea(
        display.width,
        display.height,
        initialAspectRatio === 0 ? undefined : initialAspectRatio,
      );
      setCropArea(initialCrop);
    }
  };

  // Reset states when modal closes
  useEffect(() => {
    if (!visible) {
      setImage(null);
      setImageLoaded(false);
      setRotation(0);
      setCropArea({ x: 50, y: 50, width: 200, height: 200 });
    }
  }, [visible]);

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
            <IconSymbol name="xmark" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Canvas Cropper */}
        {Platform.OS === "web" && (
          <div
            ref={containerRef}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: CONTAINER_WIDTH,
              height: CONTAINER_HEIGHT,
              background: baseColors.black,
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: spacing.lg,
              margin: "0 auto 16px auto",
              touchAction: "none",
            }}
          >
            {!imageLoaded && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: colors.white,
                }}
              >
                Loading image...
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={CONTAINER_WIDTH}
              height={CONTAINER_HEIGHT}
              style={{
                display: imageLoaded ? "block" : "none",
                width: "100%",
                height: "100%",
                touchAction: "none",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
        )}

        {/* Transform Controls */}
        <View style={styles.controlSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Transform
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => handleRotate(-90)}
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
              disabled={processing || !imageLoaded}
            >
              <Text style={[styles.iconButtonText, { color: colors.text }]}>
                ↺ 90°
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRotate(90)}
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
              disabled={processing || !imageLoaded}
            >
              <Text style={[styles.iconButtonText, { color: colors.text }]}>
                ↻ 90°
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
            {[
              { label: "1:1", value: 1 },
              { label: "4:3", value: 4 / 3 },
              { label: "16:9", value: 16 / 9 },
              { label: "Free", value: undefined },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => setAspectRatio(item.value)}
                style={[
                  styles.aspectButton,
                  {
                    backgroundColor:
                      (item.value === undefined && aspectRatio === undefined) ||
                      (item.value !== undefined &&
                        aspectRatio !== undefined &&
                        Math.abs(aspectRatio - item.value) < 0.01)
                        ? colors.primary
                        : colors.secondary,
                  },
                ]}
                disabled={processing}
              >
                <Text
                  style={[
                    styles.aspectButtonText,
                    {
                      color:
                        (item.value === undefined &&
                          aspectRatio === undefined) ||
                        (item.value !== undefined &&
                          aspectRatio !== undefined &&
                          Math.abs(aspectRatio - item.value) < 0.01)
                          ? "white"
                          : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
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
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReset}
            disabled={processing}
            style={[
              styles.button,
              styles.resetButton,
              { backgroundColor: colors.secondary },
              processing && styles.disabledButton,
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={processing || !imageLoaded}
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: colors.primary },
              (processing || !imageLoaded) && styles.disabledButton,
            ]}
          >
            <Text style={[styles.buttonText, styles.saveButtonText]}>
              {processing ? "Processing..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (
    Platform.OS === "web" &&
    createPortal &&
    typeof document !== "undefined"
  ) {
    return createPortal(modalContent, document.body);
  }

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
    backgroundColor: withOpacity(baseColors.black, 0.8),
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  } as ViewStyle,
  webOverlay: {
    ...(Platform.OS === "web"
      ? {
          position: "fixed" as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2147483647,
        }
      : {}),
  } as ViewStyle,
  container: {
    borderRadius: 16,
    padding: spacing.xl,
    maxWidth: 550,
    width: "100%",
  } as ViewStyle,
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  } as ViewStyle,
  title: {
    fontSize: 20,
    fontWeight: "700",
  } as TextStyle,
  closeButton: {
    padding: spacing.sm,
  } as ViewStyle,
  closeText: {
    fontSize: 20,
  } as TextStyle,
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.md,
  } as TextStyle,
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  } as ViewStyle,
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  } as ViewStyle,
  saveButton: {
    borderWidth: 0,
  } as ViewStyle,
  resetButton: {
    borderWidth: 0,
  } as ViewStyle,
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  } as TextStyle,
  saveButtonText: {
    color: "white",
  } as TextStyle,
  disabledButton: {
    opacity: 0.5,
  } as ViewStyle,
  controlSection: {
    marginBottom: spacing.md,
  } as ViewStyle,
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.sm,
  } as TextStyle,
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  } as ViewStyle,
  iconButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  iconButtonText: {
    fontSize: 14,
    fontWeight: "600",
  } as TextStyle,
  aspectButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  aspectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  } as TextStyle,
});
