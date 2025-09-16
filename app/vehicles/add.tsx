import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { VehicleService } from '@/lib/services/vehicleService';
import { VehicleFormData } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertModal } from '@/components/ui/Modal';

export default function AddVehicleScreen() {
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSave = async () => {
    // Validation
    if (!formData.make.trim()) {
      setErrorMessage('Please enter the vehicle make');
      setShowErrorModal(true);
      return;
    }
    if (!formData.model.trim()) {
      setErrorMessage('Please enter the vehicle model');
      setShowErrorModal(true);
      return;
    }
    if (!formData.license_plate.trim()) {
      setErrorMessage('Please enter the license plate');
      setShowErrorModal(true);
      return;
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 2) {
      setErrorMessage('Please enter a valid year');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    const vehicleData = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year,
      license_plate: formData.license_plate.trim().toUpperCase(),
      vin: formData.vin?.trim() || undefined,
    };

    const { data, error } = await VehicleService.createVehicle(vehicleData);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const validateMake = (value: string) => {
    if (!value.trim()) return 'Make is required';
    return undefined;
  };

  const validateModel = (value: string) => {
    if (!value.trim()) return 'Model is required';
    return undefined;
  };

  const validateYear = (value: string) => {
    const year = parseInt(value);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      return 'Please enter a valid year';
    }
    return undefined;
  };

  const validateLicensePlate = (value: string) => {
    if (!value.trim()) return 'License plate is required';
    return undefined;
  };

  const validateVin = (value: string) => {
    if (value && value.length !== 17) {
      return 'VIN must be exactly 17 characters';
    }
    return undefined;
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
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    flex1: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Vehicle</Text>
        <Button
          title="Save"
          onPress={handleSave}
          disabled={!isFormValid()}
          loading={loading}
          icon="checkmark"
          size="small"
        />
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
          <Card variant="default" padding="large">
            <CardContent>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Make"
                      value={formData.make}
                      onChangeText={(text) =>
                        setFormData(prev => ({ ...prev, make: text }))
                      }
                      placeholder="Toyota"
                      autoCapitalize="words"
                      autoCorrect={false}
                      required
                      error={validateMake(formData.make)}
                      leftIcon="car"
                    />
                  </View>

                  <View style={styles.flex1}>
                    <Input
                      label="Model"
                      value={formData.model}
                      onChangeText={(text) =>
                        setFormData(prev => ({ ...prev, model: text }))
                      }
                      placeholder="Camry"
                      autoCapitalize="words"
                      autoCorrect={false}
                      required
                      error={validateModel(formData.model)}
                    />
                  </View>
                </View>

                <Input
                  label="Year"
                  value={formData.year.toString()}
                  onChangeText={(text) => {
                    const year = parseInt(text) || new Date().getFullYear();
                    setFormData(prev => ({ ...prev, year }));
                  }}
                  placeholder="2024"
                  keyboardType="numeric"
                  maxLength={4}
                  required
                  error={validateYear(formData.year.toString())}
                  leftIcon="calendar"
                />

                <Input
                  label="License Plate"
                  value={formData.license_plate}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, license_plate: text.toUpperCase() }))
                  }
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  required
                  error={validateLicensePlate(formData.license_plate)}
                  helperText="Enter the license plate number as shown on your vehicle"
                  leftIcon="number"
                />

                <Input
                  label="VIN (Optional)"
                  value={formData.vin || ''}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, vin: text.toUpperCase() }))
                  }
                  placeholder="1HGBH41JXMN109186"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={17}
                  showCharacterCount
                  error={validateVin(formData.vin || '')}
                  helperText="Vehicle Identification Number (17 characters)"
                  leftIcon="barcode"
                />
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Vehicle added successfully!"
        variant="success"
        buttonText="Done"
      />

      <AlertModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        variant="error"
      />
    </SafeAreaView>
  );
}