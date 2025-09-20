import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FuelLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { FuelLogFormData } from '@/types';
import { VehicleWithDetails } from '@/types/database-v2';
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

export default function AddFuelLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: vehicleId || '',
    liters_filled: 0,
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    odometer_reading: 0,
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await VehicleService.getVehiclesSeparated();
      if (!error && data) {
        // Combine both owned and shared vehicles for the dropdown
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
    // Validation
    if (!formData.vehicle_id) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }
    if (formData.liters_filled <= 0) {
      Alert.alert('Error', 'Please enter a valid amount of fuel');
      return;
    }
    if (formData.odometer_reading <= 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading');
      return;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    setLoading(true);

    const logData = {
      vehicle_id: formData.vehicle_id,
      liters_filled: formData.liters_filled,
      cost: formData.cost || undefined,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      location: formData.location?.trim() || undefined,
    };

    const { data, error } = await FuelLogService.createFuelLog(logData);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Fuel log added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  };

  const isFormValid = () => {
    return (
      formData.vehicle_id &&
      formData.liters_filled > 0 &&
      formData.odometer_reading > 0 &&
      formData.date
    );
  };

  const VehicleSelector = () => {
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
    const isLocked = !!vehicleId; // Lock when vehicleId is provided from navigation

    if (isLocked && selectedVehicle) {
      // Show locked single vehicle when navigated from vehicle detail
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Vehicle <Text style={styles.requiredLabel}>*</Text>
          </Text>
          <View style={styles.lockedVehicleContainer}>
            <View style={styles.lockedVehicle}>
              <View style={styles.vehicleIcon}>
                <IconSymbol name="car.fill" size={16} color="white" />
              </View>
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
              Adding fuel log for this vehicle
            </Text>
          </View>
        </View>
      );
    }

    // Show full vehicle selector when accessed from logs tab
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
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleOption,
                formData.vehicle_id === vehicle.id && styles.vehicleOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, vehicle_id: vehicle.id }))}
            >
              <View style={styles.vehicleIcon}>
                <IconSymbol name="car.fill" size={16} color="white" />
              </View>
              <Text style={[
                styles.vehicleOptionText,
                formData.vehicle_id === vehicle.id && styles.vehicleOptionTextSelected,
              ]}>
                {vehicle.year} {vehicle.make}
              </Text>
              <Text style={[
                styles.vehiclePlateText,
                formData.vehicle_id === vehicle.id && styles.vehiclePlateTextSelected,
              ]}>
                {vehicle.license_plate}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
    formCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.icon + '20',
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
    helpText: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 4,
      lineHeight: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Fuel Log</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Fuel Log</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.label, { textAlign: 'center' }]}>
            No vehicles found. Please add a vehicle first.
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 20 }]}
            onPress={() => router.push('/vehicles/add' as any)}
          >
            <IconSymbol name="plus" size={16} color="white" />
            <Text style={styles.saveButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
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
          {vehicleId && vehicles.find(v => v.id === vehicleId)
            ? `Add Fuel - ${vehicles.find(v => v.id === vehicleId)?.year} ${vehicles.find(v => v.id === vehicleId)?.make}`
            : 'Add Fuel Log'
          }
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid() || loading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
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
            <VehicleSelector />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Liters Filled <Text style={styles.requiredLabel}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.liters_filled.toString()}
                    onChangeText={(text) => {
                      const liters = parseFloat(text) || 0;
                      setFormData(prev => ({ ...prev, liters_filled: liters }));
                    }}
                    placeholder="45.50"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Cost (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.cost?.toString() || ''}
                    onChangeText={(text) => {
                      const cost = parseFloat(text) || 0;
                      setFormData(prev => ({ ...prev, cost }));
                    }}
                    placeholder="65.00"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Odometer Reading (km) <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.odometer_reading.toString()}
                onChangeText={(text) => {
                  const reading = parseInt(text.replace(/,/g, '')) || 0;
                  setFormData(prev => ({ ...prev, odometer_reading: reading }));
                }}
                placeholder="150,000"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                Odometer reading at the time of fuel fill-up
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Date <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                placeholder="01/01/2024"
                placeholderTextColor={colors.icon}
              />
              <Text style={styles.helpText}>
                Date format: DD/MM/YYYY
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Shell Station, Main St"
                placeholderTextColor={colors.icon}
              />
              <Text style={styles.helpText}>
                Gas station or location where fuel was purchased
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}