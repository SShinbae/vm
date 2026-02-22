import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal as RNModal,
} from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Modal } from "@/components/ui/Modal";
import { useDialog } from "@/lib/contexts/DialogContext";
import { OCRService, ReceiptProcessingResult } from "@/lib/services/ocrService";
import { OCRExtractedData } from "@/types";

interface ReceiptCaptureProps {
  onReceiptProcessed: (result: ReceiptProcessingResult) => void;
  onPictureOnly?: (result: ReceiptProcessingResult) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ReceiptCapture({
  onReceiptProcessed,
  onPictureOnly,
  onCancel,
  disabled = false,
}: ReceiptCaptureProps) {
  const [processing, setProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTitle, setActionSheetTitle] = useState("");
  const [actionSheetMessage, setActionSheetMessage] = useState("");
  const [actionSheetOptions, setActionSheetOptions] = useState<
    { text: string; onPress: () => void; style?: string }[]
  >([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const dialog = useDialog();

  const showActionSheet = (
    title: string,
    message: string,
    options: { text: string; onPress: () => void; style?: string }[],
  ) => {
    setActionSheetTitle(title);
    setActionSheetMessage(message);
    setActionSheetOptions(options);
    setActionSheetVisible(true);
  };
  const hideActionSheet = () => setActionSheetVisible(false);

  const handleCameraCapture = async () => {
    try {
      setProcessing(true);

      const hasPermissions = await OCRService.requestPermissions();
      if (!hasPermissions) {
        dialog.showError(
          "Permissions Required",
          "Camera and media library permissions are required to scan receipts. Please enable them in your device settings.",
        );
        return;
      }

      const result = await OCRService.processReceiptFromCamera();

      if (result.success && result.imageUri) {
        setPreviewImage(result.imageUri);
        setShowPreview(true);
        onReceiptProcessed(result);
      } else {
        let errorMessage =
          result.error || "Failed to process receipt from camera";

        if (errorMessage.includes("cancelled")) {
          return;
        } else if (errorMessage.includes("API key")) {
          errorMessage =
            "Google Vision API is not configured. Please contact support.";
        } else if (errorMessage.includes("network")) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        }

        dialog.showError("Error", errorMessage);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      dialog.showError(
        "Error",
        "An unexpected error occurred while capturing the receipt. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      setProcessing(true);

      const hasPermissions = await OCRService.requestPermissions();
      if (!hasPermissions) {
        dialog.showError(
          "Permissions Required",
          "Media library permission is required to select receipt images. Please enable it in your device settings.",
        );
        return;
      }

      const result = await OCRService.processReceiptFromGallery();

      if (result.success && result.imageUri) {
        setPreviewImage(result.imageUri);
        setShowPreview(true);
        onReceiptProcessed(result);
      } else {
        let errorMessage =
          result.error || "Failed to process receipt from gallery";

        if (errorMessage.includes("cancelled")) {
          return;
        } else if (errorMessage.includes("API key")) {
          errorMessage =
            "Google Vision API is not configured. Please contact support.";
        } else if (errorMessage.includes("network")) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (errorMessage.includes("No text")) {
          errorMessage =
            "No text was found in the image. Please try a clearer photo of your receipt.";
        }

        dialog.showError("Error", errorMessage);
      }
    } catch (error) {
      console.error("Gallery pick error:", error);
      dialog.showError(
        "Error",
        "An unexpected error occurred while processing the receipt. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePictureOnlyCamera = async () => {
    try {
      setProcessing(true);

      const hasPermissions = await OCRService.requestPermissions();
      if (!hasPermissions) {
        dialog.showError(
          "Permissions Required",
          "Camera permission is required to take pictures. Please enable it in your device settings.",
        );
        return;
      }

      const result = await OCRService.savePictureFromCamera();

      if (result.success) {
        if (result.imageUri) {
          setPreviewImage(result.imageUri);
          setShowPreview(true);
        }
        onPictureOnly?.(result);
      } else {
        let errorMessage = result.error || "Failed to save picture from camera";
        if (errorMessage.includes("cancelled")) {
          return;
        }
        dialog.showError("Error", errorMessage);
      }
    } catch (error) {
      console.error("Picture only camera error:", error);
      dialog.showError(
        "Error",
        "An unexpected error occurred while taking the picture. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePictureOnlyGallery = async () => {
    try {
      setProcessing(true);

      const hasPermissions = await OCRService.requestPermissions();
      if (!hasPermissions) {
        dialog.showError(
          "Permissions Required",
          "Media library permission is required to select pictures. Please enable it in your device settings.",
        );
        return;
      }

      const result = await OCRService.savePictureFromGallery();

      if (result.success) {
        if (result.imageUri) {
          setPreviewImage(result.imageUri);
          setShowPreview(true);
        }
        onPictureOnly?.(result);
      } else {
        let errorMessage =
          result.error || "Failed to save picture from gallery";
        if (errorMessage.includes("cancelled")) {
          return;
        }
        dialog.showError("Error", errorMessage);
      }
    } catch (error) {
      console.error("Picture only gallery error:", error);
      dialog.showError(
        "Error",
        "An unexpected error occurred while selecting the picture. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleOptionSelect = () => {
    showActionSheet(
      "Add Receipt/Picture",
      "Choose how you want to add your service receipt or picture:",
      [
        {
          text: "Scan Receipt (OCR)",
          onPress: () => {
            hideActionSheet();
            setTimeout(() => {
              showActionSheet(
                "Scan Receipt",
                "Enhanced OCR will extract service type, cost, date, mileage, and business info. For best results, ensure good lighting and clear text.",
                [
                  {
                    text: "Take Photo",
                    onPress: () => {
                      hideActionSheet();
                      handleCameraCapture();
                    },
                  },
                  {
                    text: "Choose from Gallery",
                    onPress: () => {
                      hideActionSheet();
                      handleGalleryPick();
                    },
                  },
                  {
                    text: "Back",
                    style: "cancel",
                    onPress: () => {
                      hideActionSheet();
                      setTimeout(() => handleOptionSelect(), 100);
                    },
                  },
                ],
              );
            }, 100);
          },
        },
        {
          text: "Save Picture Only",
          onPress: () => {
            hideActionSheet();
            setTimeout(() => {
              showActionSheet(
                "Save Picture",
                "This will save the picture without processing text. You can review it later with your service records.",
                [
                  {
                    text: "Take Photo",
                    onPress: () => {
                      hideActionSheet();
                      handlePictureOnlyCamera();
                    },
                  },
                  {
                    text: "Choose from Gallery",
                    onPress: () => {
                      hideActionSheet();
                      handlePictureOnlyGallery();
                    },
                  },
                  {
                    text: "Back",
                    style: "cancel",
                    onPress: () => {
                      hideActionSheet();
                      setTimeout(() => handleOptionSelect(), 100);
                    },
                  },
                ],
              );
            }, 100);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            hideActionSheet();
            onCancel?.();
          },
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      gap: 12,
    },
    captureButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.tint,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
      opacity: disabled ? 0.6 : 1,
    },
    captureButtonSecondary: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.tint,
    },
    captureButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    captureButtonTextSecondary: {
      color: colors.tint,
    },
    helpText: {
      fontSize: 14,
      color: colors.icon,
      textAlign: "center",
      maxWidth: 280,
      lineHeight: 20,
    },
    processingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    processingText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    previewModal: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    previewImage: {
      width: "90%",
      height: "70%",
      borderRadius: 12,
    },
    previewControls: {
      flexDirection: "row",
      marginTop: 20,
      gap: 15,
    },
    previewButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    previewButtonSecondary: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    previewButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    actionSheetMessage: {
      fontSize: 14,
      color: colors.icon,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 20,
    },
    actionSheetOption: {
      width: "100%",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.icon + "30",
      alignItems: "center",
    },
    actionSheetOptionText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.tint,
    },
    actionSheetCancelText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.icon,
    },
  });

  if (processing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={styles.processingText}>Processing receipt...</Text>
        </View>
        <Text style={styles.helpText}>
          🔍 Using enhanced OCR to extract service details, cost, date, and
          mileage from your receipt
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleOptionSelect}
        disabled={disabled}
      >
        <IconSymbol name="camera.fill" size={20} color="white" />
        <Text style={styles.captureButtonText}>Add Receipt/Picture</Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        📱 For best OCR results: Use good lighting, keep receipt flat, ensure
        text is clear and readable
      </Text>

      <RNModal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewModal}>
          {previewImage && (
            <>
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={200}
              />
              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => setShowPreview(false)}
                >
                  <Text style={styles.previewButtonText}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, styles.previewButtonSecondary]}
                  onPress={() => {
                    setShowPreview(false);
                    setPreviewImage(null);
                  }}
                >
                  <Text style={styles.previewButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </RNModal>

      <Modal
        visible={actionSheetVisible}
        onClose={hideActionSheet}
        title={actionSheetTitle}
        size="small"
      >
        <View style={{ alignItems: "center" }}>
          <Text style={styles.actionSheetMessage}>{actionSheetMessage}</Text>
          {actionSheetOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionSheetOption}
              onPress={option.onPress}
            >
              <Text
                style={
                  option.style === "cancel"
                    ? styles.actionSheetCancelText
                    : styles.actionSheetOptionText
                }
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

interface OCRResultDisplayProps {
  ocrData: OCRExtractedData;
  onAccept: () => void;
  onReject: () => void;
}

export function OCRResultDisplay({
  ocrData,
  onAccept,
  onReject,
}: OCRResultDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { extracted_fields: fields, confidence } = ocrData;
  const confidenceColor =
    confidence > 70 ? "#4CAF50" : confidence > 50 ? "#FF9800" : "#F44336";

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.icon + "20",
      marginVertical: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    confidence: {
      fontSize: 14,
      fontWeight: "600",
      color: confidenceColor,
    },
    fieldContainer: {
      marginBottom: 8,
    },
    fieldLabel: {
      fontSize: 12,
      color: colors.icon,
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    fieldValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
      marginTop: 2,
    },
    fieldValueMissing: {
      color: colors.icon,
      fontStyle: "italic",
    },
    separator: {
      height: 1,
      backgroundColor: colors.icon + "20",
      marginVertical: 12,
    },
    buttons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },
    acceptButton: {
      backgroundColor: colors.tint,
    },
    rejectButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.icon,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    acceptButtonText: {
      color: "white",
    },
    rejectButtonText: {
      color: colors.text,
    },
  });

  const formatFieldValue = (key: string, value: any): string => {
    switch (key) {
      case "cost":
        return value ? `$${value.toFixed(2)}` : "Not detected";
      case "service_type":
        return value
          ? value
              .replace("_", " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase())
          : "Not detected";
      case "date":
        return value ? new Date(value).toLocaleDateString() : "Not detected";
      case "odometer_reading":
        return value ? `${value.toLocaleString()} km` : "Not detected";
      default:
        return value || "Not detected";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detected Information</Text>
        <Text style={styles.confidence}>{confidence}% confidence</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Service Type</Text>
        <Text
          style={[
            styles.fieldValue,
            !fields.service_type && styles.fieldValueMissing,
          ]}
        >
          {formatFieldValue("service_type", fields.service_type)}
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Description</Text>
        <Text
          style={[
            styles.fieldValue,
            !fields.description && styles.fieldValueMissing,
          ]}
        >
          {formatFieldValue("description", fields.description)}
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Cost</Text>
        <Text
          style={[styles.fieldValue, !fields.cost && styles.fieldValueMissing]}
        >
          {formatFieldValue("cost", fields.cost)}
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Date</Text>
        <Text
          style={[styles.fieldValue, !fields.date && styles.fieldValueMissing]}
        >
          {formatFieldValue("date", fields.date)}
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Odometer Reading</Text>
        <Text
          style={[
            styles.fieldValue,
            !fields.odometer_reading && styles.fieldValueMissing,
          ]}
        >
          {formatFieldValue("odometer_reading", fields.odometer_reading)}
        </Text>
      </View>

      {fields.business_name && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Service Provider</Text>
          <Text style={styles.fieldValue}>{fields.business_name}</Text>
        </View>
      )}

      <View style={styles.separator} />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
        >
          <IconSymbol name="checkmark" size={18} color="white" />
          <Text style={[styles.buttonText, styles.acceptButtonText]}>
            Use This Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <IconSymbol name="xmark" size={18} color={colors.text} />
          <Text style={[styles.buttonText, styles.rejectButtonText]}>
            Manual Entry
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
