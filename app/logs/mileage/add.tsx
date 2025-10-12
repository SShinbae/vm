import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { AlertModal } from '@/components/ui/Modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MileageLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { MileageLogFormData } from '@/types';
import { VehicleWithDetails } from '@/types/database-v2';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Separate component to handle vehicle option rendering with proper hook usage
const VehicleOption: React.FC<{
  vehicle: VehicleWithDetails;
  isSelected: boolean;
  onPress: () => void;
  styles: any;
}> = ({ vehicle, isSelected, onPress, styles }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.vehicleOption,
        isSelected && styles.vehicleOptionSelected,
      ]}
      onPress={onPress}
    >
      {vehicle.main_image_url && !imageError ? (
        <Image
          source={{ uri: vehicle.main_image_url }}
          style={styles.vehicleIcon}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.vehicleIcon}>
          <IconSymbol name="car.fill" size={16} color="white" />
        </View>
      )}
      <Text style={[
        styles.vehicleOptionText,
        isSelected && styles.vehicleOptionTextSelected,
      ]}>
        {vehicle.year} {vehicle.make}
      </Text>
      <Text style={[
        styles.vehiclePlateText,
        isSelected && styles.vehiclePlateTextSelected,
      ]}>
        {vehicle.license_plate}
      </Text>
    </TouchableOpacity>
  );
};

export default function AddMileageLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<MileageLogFormData>({
    vehicle_id: vehicleId || '',
    odometer_reading: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await VehicleService.getVehiclesSeparated();
      if (!error && data) {
        const allVehicles = [...data.ownVehicles, ...data.sharedVehicles];
        setVehicles(allVehicles);
        if (!vehicleId && allVehicles.length > 0) {
          setFormData(prev => ({ ...prev, vehicle_id: allVehicles[0].id }));
        }
      }
      setVehiclesLoading(false);
    };

    fetchVehicles();
  }, [vehicleId]);

  const handleSave = async () => {
    if (!formData.vehicle_id) {
      setErrorMessage('Please select a vehicle');
      setShowErrorModal(true);
      return;
    }
    if (formData.odometer_reading <= 0) {
      setErrorMessage('Please enter a valid odometer reading');
      setShowErrorModal(true);
      return;
    }
    if (!formData.date) {
      setErrorMessage('Please select a date');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    const logData = {
      vehicle_id: formData.vehicle_id,
      odometer_reading: formData.odometer_reading,
      date: formData.date,
      notes: formData.notes?.trim() || undefined,
    };

    const { error } = await MileageLogService.createMileageLog(logData);
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
    router.push('/(tabs)/logs');
  };

  const validateOdometer = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) return 'Please enter a valid odometer reading';
    return undefined;
  };

  const validateDate = (value: string) => {
    if (!value.trim()) return 'Date is required';
    return undefined;
  };

  const isFormValid = () => {
    return (
      formData.vehicle_id &&
      formData.odometer_reading > 0 &&
      formData.date
    );
  };

  const VehicleSelector = () => {
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
    const isLocked = !!vehicleId;
    const [imageError, setImageError] = React.useState(false);

    if (isLocked && selectedVehicle) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Vehicle <Text style={styles.requiredLabel}>*</Text>
          </Text>
          <View style={styles.lockedVehicleContainer}>
            <View style={styles.lockedVehicle}>
              {selectedVehicle.main_image_url && !imageError ? (
                <Image
                  source={{ uri: selectedVehicle.main_image_url }}
                  style={styles.vehicleIcon}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.vehicleIcon}>
                  <IconSymbol name="car.fill" size={16} color="white" />
                </View>
              )}
              <View style={styles.lockedVehicleInfo}>
                <Text style={styles.lockedVehicleText}>
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </Text>
                <Text style={styles.lockedVehiclePlate}>
                  {selectedVehicle.license_plate}
                </Text>
              </View>
              <View style={styles.lockIcon}>
                <IconSymbol name="lock.fill" size={14} color={colors.icon} />
              </View>
            </View>
            <Text style={styles.lockedHelpText}>
              Adding mileage log for this vehicle
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Vehicle <Text style={styles.requiredLabel}>*</Text>
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vehicleSelector}
          contentContainerStyle={styles.vehicleSelectorContent}
        >
          {vehicles.map((vehicle) => (
            <VehicleOption
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={formData.vehicle_id === vehicle.id}
              onPress={() => setFormData(prev => ({ ...prev, vehicle_id: vehicle.id }))}
              styles={styles}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isWeb ? colors.icon + '08' : colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
      backgroundColor: colors.background,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: isWeb ? 40 : 20,
      paddingBottom: 100,
      ...(isWeb && {
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
      }),
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: isWeb ? 'center' : 'left',
    },
    subtitle: {
      fontSize: 16,
      color: colors.icon,
      marginBottom: 32,
      textAlign: isWeb ? 'center' : 'left',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: isWeb ? 16 : 12,
      padding: isWeb ? 32 : 20,
      ...(isWeb && {
        shadowColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: colorScheme === 'dark' ? 0.1 : 0.08,
        shadowRadius: 12,
        elevation: 4,
      }),
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 32,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    vehicleSelector: {
      maxHeight: 120,
    },
    vehicleSelectorContent: {
      gap: 12,
    },
    vehicleOption: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      borderRadius: 8,
      padding: 12,
      minWidth: 120,
      alignItems: 'center',
      gap: 8,
    },
    vehicleOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.tint + '10',
    },
    vehicleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    vehicleOptionTextSelected: {
      color: colors.tint,
    },
    vehiclePlateText: {
      fontSize: 12,
      color: colors.icon,
      textAlign: 'center',
    },
    vehiclePlateTextSelected: {
      color: colors.tint,
    },
    lockedVehicleContainer: {
      gap: 8,
    },
    lockedVehicle: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    lockedVehicleInfo: {
      flex: 1,
    },
    lockedVehicleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    lockedVehiclePlate: {
      fontSize: 14,
      color: colors.icon,
      marginTop: 2,
    },
    lockIcon: {
      padding: 4,
    },
    lockedHelpText: {
      fontSize: 12,
      color: colors.icon,
      fontStyle: 'italic',
    },
  });

  if (vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {!isWeb && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Mileage Log</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {!isWeb && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Mileage Log</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <Text style={[styles.label, { textAlign: 'center' }]}>
            No vehicles found. Please add a vehicle first.
          </Text>
          <Button
            title="Add Vehicle"
            onPress={() => router.push('/vehicles/add' as any)}
            icon="plus"
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {vehicleId && vehicles.find(v => v.id === vehicleId)
              ? `Add Mileage - ${vehicles.find(v => v.id === vehicleId)?.year} ${vehicles.find(v => v.id === vehicleId)?.make}`
              : 'Add Mileage Log'
            }
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isWeb && (
            <>
              <Text style={styles.title}>Add Mileage Log</Text>
              <Text style={styles.subtitle}>Record your vehicle&apos;s mileage</Text>
            </>
          )}

          <View style={styles.card}>
            <VehicleSelector />

            <Input
              label="Odometer Reading (km)"
              value={formData.odometer_reading > 0 ? formData.odometer_reading.toString() : ''}
              onChangeText={(text) => {
                const reading = parseInt(text.replace(/,/g, '')) || 0;
                setFormData(prev => ({ ...prev, odometer_reading: reading }));
              }}
              placeholder="150,000"
              keyboardType="numeric"
              required
              error={formData.odometer_reading ? validateOdometer(formData.odometer_reading.toString()) : undefined}
              helperText="Enter the current odometer reading in kilometers"
              leftIcon="speedometer"
            />

            <Input
              label="Date"
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              placeholder="2024-01-01"
              required
              error={formData.date ? validateDate(formData.date) : undefined}
              helperText="Date format: YYYY-MM-DD"
              leftIcon="calendar"
            />

            <Input
              label="Notes (Optional)"
              value={formData.notes || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add any additional notes about this reading..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                icon="xmark"
                style={styles.cancelButton}
              />
              <Button
                title="Save Log"
                onPress={handleSave}
                disabled={!isFormValid()}
                loading={loading}
                icon="checkmark"
                style={styles.saveButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Mileage log added successfully!"
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
