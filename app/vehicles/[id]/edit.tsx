import { IconSymbol } from '@/components/ui/icon-symbol';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDialog } from '@/lib/contexts/DialogContext';
import { VehicleService } from '@/lib/services/vehicleService';
import { updateVehicleImage } from '@/lib/utils/imageUpload';
import { VehicleFormData } from '@/types';
import { Vehicle } from '@/types/database-v2';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isSharedVehicle, setIsSharedVehicle] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
  });
  const [imageUri, setImageUri] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const dialog = useDialog();

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;

      const { data, error } = await VehicleService.getVehicleById(id);

      if (error) {
        let errorMessage = 'Failed to load vehicle details';
        if (error.includes('not found') || error.includes('access denied')) {
          errorMessage = 'Vehicle not found or you do not have permission to access it.';
        }
        Alert.alert('Error', errorMessage);
        router.back();
      } else if (data) {
        setVehicle(data);
        setIsSharedVehicle(!data.is_own_vehicle);
        setFormData({
          make: data.make,
          model: data.model,
          year: data.year,
          license_plate: data.license_plate,
          vin: data.vin || '',
        });
        setImageUri(data.main_image_url || '');
      }

      setLoading(false);
    };

    fetchVehicle();
  }, [id]);

  const performSave = async () => {
    if (!vehicle) return;

    setSaving(true);

    let finalImageUrl = vehicle.main_image_url; // Keep existing image by default

    // Handle image changes (upload new image or remove existing one)
    if (imageUri !== vehicle.main_image_url) {
      // If imageUri is empty, user wants to remove the image
      if (!imageUri) {
        finalImageUrl = null;
      } else {
        // User wants to upload a new image
        // Validate that it's not an invalid file:// URI
        if (imageUri.startsWith('file://')) {
          if (Platform.OS === 'web') {
            dialog.alert('Error', 'Invalid image format. Please try selecting the image again.');
          } else {
            Alert.alert('Error', 'Invalid image format. Please try selecting the image again.');
          }
          setSaving(false);
          return;
        }

        const uploadResult = await updateVehicleImage(
          imageUri,
          vehicle.main_image_url,
          vehicle.id
        );

        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
        } else {
          console.error('Failed to upload vehicle image:', uploadResult.error);
          if (Platform.OS === 'web') {
            dialog.showConfirm(
              'Image Upload Failed',
              'Failed to upload the vehicle image. Would you like to continue without updating the image?',
              () => {
                saveVehicleUpdates(vehicle.main_image_url);
              },
              () => {
                setSaving(false);
                dialog.hideConfirm();
              },
              'Continue',
              'Cancel'
            );
          } else {
            Alert.alert(
              'Image Upload Failed',
              'Failed to upload the vehicle image. Would you like to continue without updating the image?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => { setSaving(false); } },
                {
                  text: 'Continue',
                  onPress: () => {
                    // Continue with the rest of the save logic
                    saveVehicleUpdates(vehicle.main_image_url);
                  }
                }
              ]
            );
          }
          return;
        }
      }
    }

    saveVehicleUpdates(finalImageUrl);
  };

  const handleSave = () => {
    if (!vehicle) return;

    // Check if this is a shared vehicle - only owners can edit vehicle details
    if (isSharedVehicle) {
      if (Platform.OS === 'web') {
        dialog.alert(
          'Cannot Edit Vehicle',
          'Only the vehicle owner can edit vehicle details. You have read-only access to this shared vehicle.'
        );
      } else {
        Alert.alert(
          'Cannot Edit Vehicle',
          'Only the vehicle owner can edit vehicle details. You have read-only access to this shared vehicle.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    // Validation
    if (!formData.make.trim()) {
      if (Platform.OS === 'web') {
        dialog.alert('Error', 'Please enter the vehicle make');
      } else {
        Alert.alert('Error', 'Please enter the vehicle make');
      }
      return;
    }
    if (!formData.model.trim()) {
      if (Platform.OS === 'web') {
        dialog.alert('Error', 'Please enter the vehicle model');
      } else {
        Alert.alert('Error', 'Please enter the vehicle model');
      }
      return;
    }
    if (!formData.license_plate.trim()) {
      if (Platform.OS === 'web') {
        dialog.alert('Error', 'Please enter the license plate');
      } else {
        Alert.alert('Error', 'Please enter the license plate');
      }
      return;
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 2) {
      if (Platform.OS === 'web') {
        dialog.alert('Error', 'Please enter a valid year');
      } else {
        Alert.alert('Error', 'Please enter a valid year');
      }
      return;
    }

    // Show confirmation modal on web, proceed directly on mobile
    if (Platform.OS === 'web') {
      dialog.showConfirm(
        'Update Vehicle',
        'Are you sure you want to save these changes?',
        async () => {
          await performSave();
          dialog.hideConfirm();
        },
        undefined,
        'Update',
        'Cancel'
      );
    } else {
      performSave();
    }
  };

  const saveVehicleUpdates = async (imageUrl: string | null) => {
    if (!vehicle) return;

    const updates = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year,
      license_plate: formData.license_plate.trim().toUpperCase(),
      vin: formData.vin?.trim() || null,
      main_image_url: imageUrl || null,
    };

    const { error } = await VehicleService.updateVehicle(vehicle.id, updates);
    setSaving(false);

    if (error) {
      let errorMessage = error;
      if (error.includes('permission') || error.includes('access denied')) {
        errorMessage = 'You do not have permission to edit this vehicle. Only the owner can modify vehicle details.';
      }
      Alert.alert('Error', errorMessage);
    } else {
      if (Platform.OS === 'web') {
        dialog.showSuccess('Success', 'Vehicle updated successfully', () => {
          router.push('/(tabs)/vehicles');
        });
      } else {
        Alert.alert('Success', 'Vehicle updated successfully', [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/vehicles'),
          },
        ]);
      }
    }
  };

  const handleRemoveImage = () => {
    if (Platform.OS === 'web') {
      // Use custom dialog on web
      dialog.showConfirm(
        'Remove Photo',
        'Are you sure you want to remove this photo?',
        () => {
          setImageUri('');
          dialog.hideConfirm();
        },
        undefined,
        'Remove',
        'Cancel',
        true
      );
    } else {
      // Use native Alert on mobile
      Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setImageUri('') },
      ]);
    }
  };

  const isFormValid = () => {
    return (
      formData.make.trim() &&
      formData.model.trim() &&
      formData.license_plate.trim() &&
      formData.year >= 1900 &&
      formData.year <= new Date().getFullYear() + 2
    );
  };

  const hasChanges = () => {
    if (!vehicle) return false;
    return (
      formData.make.trim() !== vehicle.make ||
      formData.model.trim() !== vehicle.model ||
      formData.year !== vehicle.year ||
      formData.license_plate.trim().toUpperCase() !== vehicle.license_plate ||
      (formData.vin?.trim() || null) !== vehicle.vin ||
      imageUri !== (vehicle.main_image_url || '')
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    saveButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: '#ff4444',
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    flex1: {
      flex: 1,
    },
    helpText: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 4,
      lineHeight: 16,
    },
    formCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sharedNotice: {
      backgroundColor: colors.icon + '10',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sharedNoticeText: {
      fontSize: 14,
      color: colors.icon,
      flex: 1,
      lineHeight: 18,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Vehicle</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          Edit Vehicle {isSharedVehicle && '(Shared)'}
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid() || !hasChanges() || saving || isSharedVehicle) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid() || !hasChanges() || saving || isSharedVehicle}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <IconSymbol name="checkmark" size={14} color="white" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {isSharedVehicle && (
              <View style={styles.sharedNotice}>
                <IconSymbol name="person.2.fill" size={16} color={colors.icon} />
                <Text style={styles.sharedNoticeText}>
                  This is a shared vehicle. Only the owner can edit vehicle details.
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              {!isSharedVehicle && (
                <ImagePicker
                  onImageSelected={setImageUri}
                  currentImage={imageUri}
                  label="Vehicle Photo (Optional)"
                  placeholder="Add a vehicle photo"
                  aspectRatio={[1, 1]}
                  allowsEditing={true}
                  onRemove={handleRemoveImage}
                  enableWebCropping={true}
                  cropAspectRatio={1}
                  cropTitle="Crop Vehicle Photo"
                  cropDescription="Drag to adjust the crop area. Use the corner handles to resize. The grid lines help you align your photo for best results."
                />
              )}

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      Make <Text style={styles.requiredLabel}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={formData.make}
                      onChangeText={(text) =>
                        setFormData(prev => ({ ...prev, make: text }))
                      }
                      placeholder="Toyota"
                      placeholderTextColor={colors.icon}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.flex1}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      Model <Text style={styles.requiredLabel}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={formData.model}
                      onChangeText={(text) =>
                        setFormData(prev => ({ ...prev, model: text }))
                      }
                      placeholder="Camry"
                      placeholderTextColor={colors.icon}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Year <Text style={styles.requiredLabel}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.year.toString()}
                  onChangeText={(text) => {
                    const year = parseInt(text) || new Date().getFullYear();
                    setFormData(prev => ({ ...prev, year }));
                  }}
                  placeholder="2024"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  License Plate <Text style={styles.requiredLabel}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.license_plate}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, license_plate: text.toUpperCase() }))
                  }
                  placeholder="ABC123"
                  placeholderTextColor={colors.icon}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Text style={styles.helpText}>
                  Enter the license plate number as shown on your vehicle
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>VIN (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.vin}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, vin: text.toUpperCase() }))
                  }
                  placeholder="1HGBH41JXMN109186"
                  placeholderTextColor={colors.icon}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={17}
                />
                <Text style={styles.helpText}>
                  Vehicle Identification Number (17 characters)
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}