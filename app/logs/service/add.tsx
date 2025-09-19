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
import { ServiceLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { ServiceLogFormData, Vehicle, ServiceType } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const SERVICE_TYPES: { value: ServiceType; label: string; icon: string }[] = [
  { value: 'oil_change', label: 'Oil Change', icon: 'drop' },
  { value: 'tire_rotation', label: 'Tire Rotation', icon: 'circle' },
  { value: 'brake_service', label: 'Brake Service', icon: 'stop' },
  { value: 'general_maintenance', label: 'General Maintenance', icon: 'wrench' },
  { value: 'repair', label: 'Repair', icon: 'hammer' },
  { value: 'inspection', label: 'Inspection', icon: 'checkmark.shield' },
  { value: 'other', label: 'Other', icon: 'ellipsis' },
];

export default function AddServiceLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: vehicleId || '',
    service_type: 'general_maintenance',
    description: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    odometer_reading: 0,
    next_service_due: '',
  });
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await VehicleService.getVehicles();
      if (!error && data) {
        setVehicles(data);
        if (!vehicleId && data.length > 0) {
          setFormData(prev => ({ ...prev, vehicle_id: data[0].id }));
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
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a service description');
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
      service_type: formData.service_type,
      description: formData.description.trim(),
      cost: formData.cost || undefined,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
    };

    const { data, error } = await ServiceLogService.createServiceLog(logData);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Service log added successfully', [
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
      formData.description.trim() &&
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
              Adding service log for this vehicle
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

  const ServiceTypeSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        Service Type <Text style={styles.requiredLabel}>*</Text>
      </Text>
      <View style={styles.serviceTypeGrid}>
        {SERVICE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.serviceTypeOption,
              formData.service_type === type.value && styles.serviceTypeOptionSelected,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, service_type: type.value }))}
          >
            <IconSymbol
              name={type.icon}
              size={20}
              color={formData.service_type === type.value ? colors.tint : colors.icon}
            />
            <Text style={[
              styles.serviceTypeText,
              formData.service_type === type.value && styles.serviceTypeTextSelected,
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
    textArea: {
      height: 80,
      textAlignVertical: 'top',
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
    serviceTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    serviceTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      minWidth: '45%',
    },
    serviceTypeOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.tint + '10',
    },
    serviceTypeText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    serviceTypeTextSelected: {
      color: colors.tint,
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
          <Text style={styles.title}>Add Service Log</Text>
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
          <Text style={styles.title}>Add Service Log</Text>
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
            ? `Add Service - ${vehicles.find(v => v.id === vehicleId)?.year} ${vehicles.find(v => v.id === vehicleId)?.make}`
            : 'Add Service Log'
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

            <ServiceTypeSelector />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Description <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe the service performed..."
                placeholderTextColor={colors.icon}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.row}>
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
                    placeholder="150.00"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Odometer (km) <Text style={styles.requiredLabel}>*</Text>
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
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Date <Text style={styles.requiredLabel}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                    placeholder="2024-01-01"
                    placeholderTextColor={colors.icon}
                  />
                </View>
              </View>

              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Next Service Due</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.next_service_due}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, next_service_due: text }))}
                    placeholder="2024-06-01"
                    placeholderTextColor={colors.icon}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}