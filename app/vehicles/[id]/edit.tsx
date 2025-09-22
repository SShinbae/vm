import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { VehicleService } from '@/lib/services/vehicleService';
import { Vehicle, VehicleFormData } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      }

      setLoading(false);
    };

    fetchVehicle();
  }, [id]);

  const handleSave = async () => {
    if (!vehicle) return;

    // Check if this is a shared vehicle - only owners can edit vehicle details
    if (isSharedVehicle) {
      Alert.alert(
        'Cannot Edit Vehicle',
        'Only the vehicle owner can edit vehicle details. You have read-only access to this shared vehicle.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation
    if (!formData.make.trim()) {
      Alert.alert('Error', 'Please enter the vehicle make');
      return;
    }
    if (!formData.model.trim()) {
      Alert.alert('Error', 'Please enter the vehicle model');
      return;
    }
    if (!formData.license_plate.trim()) {
      Alert.alert('Error', 'Please enter the license plate');
      return;
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 2) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    setSaving(true);

    const updates = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year,
      license_plate: formData.license_plate.trim().toUpperCase(),
      vin: formData.vin?.trim() || null,
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
      Alert.alert('Success', 'Vehicle updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
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
      (formData.vin?.trim() || null) !== vehicle.vin
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