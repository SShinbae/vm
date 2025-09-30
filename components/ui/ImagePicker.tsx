import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { IconSymbol } from './icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  currentImage?: string | null;
  aspectRatio?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
  label?: string;
  placeholder?: string;
  onRemove?: () => void; // Optional custom remove handler
}

export function ImagePicker({
  onImageSelected,
  currentImage,
  aspectRatio = [16, 9],
  quality = 0.8,
  allowsEditing = true,
  label = 'Vehicle Photo',
  placeholder = 'Add a photo',
  onRemove,
}: ImagePickerProps) {
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ExpoImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library permissions are required to add photos.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing,
        aspect: aspectRatio,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing,
        aspect: aspectRatio,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      // On web, directly open gallery
      pickImageFromGallery();
    } else {
      // On mobile, show options for camera or gallery
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const removeImage = () => {
    if (onRemove) {
      // Use custom remove handler if provided
      onRemove();
    } else {
      // Default behavior: show native alert
      Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onImageSelected('') },
      ]);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    imageContainer: {
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.icon + '40',
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
      padding: 8,
    },
    placeholder: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    placeholderIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    placeholderHint: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={currentImage ? removeImage : showImageOptions}
          activeOpacity={0.7}
        >
          {currentImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: currentImage }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
              >
                <IconSymbol name="xmark" size={16} color="white" />
              </TouchableOpacity>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <IconSymbol name="camera.fill" size={32} color={colors.tint} />
              </View>
              <Text style={styles.placeholderText}>{placeholder}</Text>
              <Text style={styles.placeholderHint}>
                {Platform.OS === 'web'
                  ? 'Click to upload a photo'
                  : 'Tap to take a photo or choose from gallery'}
              </Text>
              {loading && <ActivityIndicator size="small" color={colors.tint} />}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}