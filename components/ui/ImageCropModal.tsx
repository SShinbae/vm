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

// Import react-easy-crop for web
let CropperComponent: any = null;
if (Platform.OS === "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactEasyCrop = require("react-easy-crop");
    CropperComponent = ReactEasyCrop.default;
  } catch (error) {
    console.warn("react-easy-crop not available:", error);
  }
}

// Canvas-based cropping helper functions for web
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    if (Platform.OS !== "web") {
      reject(new Error("createImage only works on web"));
      return;
    }
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error: any) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => {
  return (degreeValue * Math.PI) / 180;
};

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9,
    );
  });
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
  aspectRatio = undefined, // Default to free crop
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
  aspectRatio: number | undefined;
  colors: any;
  processing: boolean;
  setProcessing: (val: boolean) => void;
}> = ({
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
  // react-easy-crop state management
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(
    initialAspectRatio === 0 || initialAspectRatio === undefined
      ? undefined
      : initialAspectRatio,
  );
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // react-easy-crop callback to capture crop coordinates
  const onCropComplete = useCallback(
    (
      _croppedArea: any,
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // Handle save with new getCroppedImg helper
  const handleSave = async () => {
    if (processing || !croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageUri,
        croppedAreaPixels,
        rotation,
        flipHorizontal,
        flipVertical,
      );

      const file = new File([croppedImage], `cropped_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      onComplete(file);
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
  const handleAspectRatioChange = (newRatio: number | undefined) => {
    setAspectRatio(newRatio);
  };

  // Reset all transformations
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setAspectRatio(
      initialAspectRatio === 0 || initialAspectRatio === undefined
        ? undefined
        : initialAspectRatio,
    );
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

        {/* Crop Container with react-easy-crop */}
        <div
          style={{
            position: "relative",
            width: "90vw",
            maxWidth: "500px",
            height: "400px",
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {CropperComponent && (
            <CropperComponent
              image={imageUri}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={true}
              zoomSpeed={0.5}
              cropShape="rect"
              style={{
                containerStyle: {
                  backgroundColor: "transparent",
                },
                cropAreaStyle: {
                  borderColor: colors.tint,
                  color: colors.tint + "50",
                },
              }}
            />
          )}
        </div>

        {/* Zoom Controls */}
        <View style={styles.controlSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Zoom
          </Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              onPress={() => setZoom(Math.max(1, zoom - 0.1))}
              style={[
                styles.smallButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              disabled={processing}
            >
              <Text style={[styles.smallButtonText, { color: colors.text }]}>
                −
              </Text>
            </TouchableOpacity>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, margin: "0 12px" }}
            />

            <TouchableOpacity
              onPress={() => setZoom(Math.min(3, zoom + 0.1))}
              style={[
                styles.smallButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              disabled={processing}
            >
              <Text style={[styles.smallButtonText, { color: colors.text }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                    aspectRatio && Math.abs(aspectRatio - 4 / 3) < 0.01
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
                      aspectRatio && Math.abs(aspectRatio - 4 / 3) < 0.01
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
                    aspectRatio && Math.abs(aspectRatio - 16 / 9) < 0.01
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
                      aspectRatio && Math.abs(aspectRatio - 16 / 9) < 0.01
                        ? "white"
                        : colors.text,
                  },
                ]}
              >
                16:9
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAspectRatioChange(undefined)}
              style={[
                styles.aspectButton,
                {
                  backgroundColor:
                    aspectRatio === undefined
                      ? colors.tint
                      : colors.backgroundSecondary,
                },
              ]}
              disabled={processing}
            >
              <Text
                style={[
                  styles.aspectButtonText,
                  { color: aspectRatio === undefined ? "white" : colors.text },
                ]}
              >
                Free
              </Text>
            </TouchableOpacity>
          </View>
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
    gap: 12,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 18,
    fontWeight: "600",
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
});
