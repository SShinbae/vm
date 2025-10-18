import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "./icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ImageUploadService } from "@/lib/services/imageUploadService";
import { ImageCropModal } from "./ImageCropModal";

interface ImageUploadProps {
  type: "avatar" | "vehicle_main" | "vehicle_gallery";
  vehicleId?: string; // Required for vehicle images
  currentImageUrl?: string | null;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  maxSize?: number; // in MB
  disabled?: boolean;
  placeholder?: string;
  style?: any;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  type,
  vehicleId,
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  maxSize = 5,
  disabled = false,
  placeholder,
  style,
}) => {
  const [uploading, setUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleImageSelect = () => {
    if (disabled || uploading) return;

    if (Platform.OS === "web") {
      // Web: Use file input
      fileInputRef.current?.click();
    } else {
      // Mobile: Use ImagePicker (would need expo-image-picker)
      Alert.alert("Select Image", "Choose image source", [
        { text: "Camera", onPress: () => pickImageFromCamera() },
        { text: "Gallery", onPress: () => pickImageFromGallery() },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleFileSelect = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      // For web, show crop modal first
      const imageUrl = URL.createObjectURL(file);
      setSelectedImageUri(imageUrl);
      setShowCropModal(true);
    }
  };

  const pickImageFromCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera access is required to take photos.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Camera Error", error.message || "Failed to access camera");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Photo library access is required to select images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(
        "Gallery Error",
        error.message || "Failed to access photo library",
      );
    }
  };

  const processImageUri = async (uri: string) => {
    try {
      setUploading(true);
      setLocalImageUri(uri);

      // Convert URI to File for upload service
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `image_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });

      // Validate file
      const validation = ImageUploadService.validateImageFile(file);
      if (!validation.isValid) {
        onUploadError?.(validation.error!);
        Alert.alert("Invalid File", validation.error!);
        setLocalImageUri(null);
        return;
      }

      let result;
      if (type === "avatar") {
        result = await ImageUploadService.uploadProfileAvatar(file);
      } else {
        if (!vehicleId) {
          throw new Error("Vehicle ID is required for vehicle images");
        }
        result = await ImageUploadService.uploadVehicleImage(
          vehicleId,
          file,
          type === "vehicle_main" ? "vehicle_main" : "vehicle_gallery",
        );
      }

      if (result.error) {
        onUploadError?.(result.error);
        Alert.alert("Upload Failed", result.error);
        setLocalImageUri(null);
      } else {
        const imageUrl =
          type === "avatar" ? result.data! : result.data!.image_url;
        onUploadComplete?.(imageUrl);
        Alert.alert("Success", "Image uploaded successfully!");
      }
    } catch (error: any) {
      onUploadError?.(error.message);
      Alert.alert("Upload Error", error.message);
      setLocalImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    console.log("🎯 Crop complete, received file:", croppedFile);
    console.log("   File details:", {
      name: croppedFile.name,
      size: croppedFile.size,
      type: croppedFile.type,
      lastModified: croppedFile.lastModified,
    });
    setShowCropModal(false);
    if (selectedImageUri) {
      URL.revokeObjectURL(selectedImageUri);
      setSelectedImageUri(null);
    }
    processImageFile(croppedFile);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    if (selectedImageUri) {
      URL.revokeObjectURL(selectedImageUri);
      setSelectedImageUri(null);
    }
  };

  const handleCropError = (error: string) => {
    setShowCropModal(false);
    if (selectedImageUri) {
      URL.revokeObjectURL(selectedImageUri);
      setSelectedImageUri(null);
    }
    onUploadError?.(error);
    Alert.alert("Crop Error", error);
  };

  const processImageFile = async (file: File) => {
    try {
      console.log(
        "📤 Starting upload process for file:",
        file.name,
        file.size,
        file.type,
      );

      // Validate file
      const validation = ImageUploadService.validateImageFile(file);
      if (!validation.isValid) {
        console.error("❌ Validation failed:", validation.error);
        onUploadError?.(validation.error!);
        Alert.alert("Invalid File", validation.error!);
        return;
      }

      console.log("✅ Validation passed, starting upload...");
      setUploading(true);
      setLocalImageUri(URL.createObjectURL(file));

      let result;
      if (type === "avatar") {
        console.log("📸 Uploading avatar...");
        result = await ImageUploadService.uploadProfileAvatar(file);
      } else {
        if (!vehicleId) {
          throw new Error("Vehicle ID is required for vehicle images");
        }
        console.log("🚗 Uploading vehicle image...");
        result = await ImageUploadService.uploadVehicleImage(
          vehicleId,
          file,
          type === "vehicle_main" ? "vehicle_main" : "vehicle_gallery",
        );
      }

      console.log("📦 Upload result:", result);

      if (result.error) {
        console.error("❌ Upload failed:", result.error);
        onUploadError?.(result.error);
        Alert.alert("Upload Failed", result.error);
        setLocalImageUri(null);
      } else {
        const imageUrl =
          type === "avatar" ? result.data! : result.data!.image_url;
        console.log("✅ Upload successful! Image URL:", imageUrl);
        onUploadComplete?.(imageUrl);
        Alert.alert("Success", "Image uploaded successfully!");
      }
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      onUploadError?.(error.message);
      Alert.alert("Upload Error", error.message);
      setLocalImageUri(null);
    } finally {
      console.log("🏁 Upload process complete, resetting uploading state");
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setUploading(true);

            if (type === "avatar") {
              const result = await ImageUploadService.deleteProfileAvatar();
              if (result.error) {
                Alert.alert("Delete Failed", result.error);
              } else {
                onUploadComplete?.(null as any);
                setLocalImageUri(null);
                Alert.alert("Success", "Avatar deleted successfully!");
              }
            } else {
              // For vehicle images, this would need the image ID
              Alert.alert(
                "Info",
                "Vehicle image deletion requires additional implementation",
              );
            }
          } catch (error: any) {
            Alert.alert("Delete Error", error.message);
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const getImageSize = () => {
    switch (type) {
      case "avatar":
        return { width: 120, height: 120, borderRadius: 60 };
      case "vehicle_main":
        return { width: 200, height: 150, borderRadius: 12 };
      case "vehicle_gallery":
        return { width: 100, height: 100, borderRadius: 8 };
      default:
        return { width: 100, height: 100, borderRadius: 8 };
    }
  };

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;

    switch (type) {
      case "avatar":
        return "Add Profile Photo";
      case "vehicle_main":
        return "Add Main Photo";
      case "vehicle_gallery":
        return "Add Photo";
      default:
        return "Add Image";
    }
  };

  const imageSource = localImageUri || currentImageUrl;
  const imageSize = getImageSize();

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      ...style,
    },
    imageContainer: {
      ...imageSize,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.icon + "30",
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    placeholder: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    placeholderIcon: {
      marginBottom: 8,
    },
    placeholderText: {
      fontSize: 12,
      color: colors.icon,
      textAlign: "center",
      fontWeight: "500",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButton: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#ff4444",
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    uploadingText: {
      fontSize: 12,
      color: "white",
      fontWeight: "500",
      marginTop: 4,
    },
    hiddenInput: {
      position: "absolute",
      left: -9999,
      opacity: 0,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.imageContainer,
          disabled && { opacity: 0.5 },
          imageSource && { borderStyle: "solid", borderColor: colors.tint },
        ]}
        onPress={handleImageSelect}
        disabled={disabled || uploading}
      >
        {imageSource ? (
          <>
            <Image
              source={{ uri: imageSource }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {!uploading && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteImage}
              >
                <IconSymbol name="xmark" size={12} color="white" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <IconSymbol
                name={type === "avatar" ? "person.circle" : "camera"}
                size={type === "avatar" ? 40 : 32}
                color={colors.icon}
              />
            </View>
            <Text style={styles.placeholderText}>{getPlaceholderText()}</Text>
          </View>
        )}

        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Hidden file input for web */}
      {Platform.OS === "web" && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={styles.hiddenInput}
        />
      )}

      {/* Image Crop Modal for web */}
      {Platform.OS === "web" && selectedImageUri && (
        <ImageCropModal
          visible={showCropModal}
          imageUri={selectedImageUri}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          onError={handleCropError}
        />
      )}
    </View>
  );
};

// Image Gallery Component for vehicle images
interface ImageGalleryProps {
  vehicleId: string;
  images: any[]; // VehicleImage[]
  onImageAdded?: () => void;
  onImageDeleted?: () => void;
  editable?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  vehicleId,
  images,
  onImageAdded,
  onImageDeleted,
  editable = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleImageUpload = (imageUrl: string) => {
    onImageAdded?.();
  };

  const handleImageError = (error: string) => {
    Alert.alert("Upload Error", error);
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    gallery: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    imageItem: {
      position: "relative",
    },
    emptyText: {
      fontSize: 14,
      color: colors.icon,
      textAlign: "center",
      fontStyle: "italic",
      marginVertical: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Photos</Text>

      <View style={styles.gallery}>
        {/* Add new image button */}
        {editable && (
          <ImageUpload
            type="vehicle_gallery"
            vehicleId={vehicleId}
            onUploadComplete={handleImageUpload}
            onUploadError={handleImageError}
          />
        )}

        {/* Existing images */}
        {images.map((image) => (
          <View key={image.id} style={styles.imageItem}>
            <Image
              source={{ uri: image.image_url }}
              style={{ width: 100, height: 100, borderRadius: 8 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {editable && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  backgroundColor: "#ff4444",
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => {
                  Alert.alert("Delete Image", "Are you sure?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        const result =
                          await ImageUploadService.deleteVehicleImage(image.id);
                        if (result.error) {
                          Alert.alert("Error", result.error);
                        } else {
                          onImageDeleted?.();
                        }
                      },
                    },
                  ]);
                }}
              >
                <IconSymbol name="xmark" size={12} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {images.length === 0 && !editable && (
        <Text style={styles.emptyText}>No photos available</Text>
      )}
    </View>
  );
};
