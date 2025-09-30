import { DatePicker } from '@/components/ui/DatePicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FuelLogService } from '@/lib/services/loggingService';
import { FuelLog, FuelLogFormData } from '@/types';
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

export default function EditFuelLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fuelLog, setFuelLog] = useState<FuelLog | null>(null);
  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: '',
    liters_filled: 0,
    cost: 0,
    fuel_price: 1.99, // Default to first option
    date: new Date().toISOString().split('T')[0],
    odometer_reading: 0,
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Auto-calculate liters based on cost and fuel price (only this direction)
  const calculateLiters = (cost: number, fuelPrice: number) => {
    if (fuelPrice > 0 && cost > 0) {
      return Math.round((cost / fuelPrice) * 1000) / 1000; // Round to 3 decimal places
    }
    return 0;
  };

  useEffect(() => {
    const fetchFuelLog = async () => {
      if (!id) {
        Alert.alert('Error', 'Invalid fuel log ID');
        router.back();
        return;
      }

      try {
        const { data: logs, error } = await FuelLogService.getFuelLogs();
        if (error) {
          console.error('Error fetching fuel logs:', error);
          let errorMessage = 'Failed to load fuel log';
          if (error.includes('User not authenticated')) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (error.includes('Failed to fetch')) {
            errorMessage = 'Unable to load fuel log. Please check your internet connection.';
          }
          Alert.alert('Error', errorMessage);
          router.back();
          return;
        }

        const log = logs?.find(l => l.id === id);
        if (!log) {
          console.error('No fuel log found with ID:', id);
          Alert.alert('Error', 'This fuel log no longer exists. It may have been deleted.', [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]);
          router.back();
          return;
        }

        setFuelLog(log);
        setFormData({
          vehicle_id: log.vehicle_id,
          liters_filled: log.liters_filled,
          cost: log.cost || 0,
          fuel_price: (log as any).fuel_price || 1.99, // Default if not set
          date: log.date,
          odometer_reading: log.odometer_reading,
          location: log.location || '',
        });
      } catch (error) {
        console.error('Error fetching fuel log:', error);
        Alert.alert('Error', 'Failed to load fuel log');
        router.back();
      }

      setDataLoading(false);
    };

    fetchFuelLog();
  }, [id]);

  const handleSave = async () => {
    // Validation
    if (!formData.cost || formData.cost <= 0) {
      Alert.alert('Error', 'Please enter a valid cost amount');
      return;
    }
    if (!formData.fuel_price || formData.fuel_price <= 0) {
      Alert.alert('Error', 'Please select a fuel price');
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

    const updateData = {
      liters_filled: formData.liters_filled,
      cost: formData.cost || undefined,
      fuel_price: formData.fuel_price || undefined,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      location: formData.location?.trim() || undefined,
    };

    const { error } = await FuelLogService.updateFuelLog(id!, updateData);
    setLoading(false);

    if (error) {
      console.error('Error updating fuel log:', error);

      // Provide more specific error messages based on the error content
      let errorMessage = error;
      if (error.includes('not found') || error.includes('no longer exists')) {
        errorMessage = 'This fuel log no longer exists. It may have been deleted by another user.';
      } else if (error.includes('Access denied') || error.includes('permission')) {
        errorMessage = 'You do not have permission to edit this fuel log. Please contact the vehicle owner if this is a shared vehicle.';
      } else if (error.includes('User not authenticated')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.includes('Failed to update fuel log')) {
        errorMessage = 'Unable to save changes. Please check your internet connection and try again.';
      } else if (error.includes('could not be updated')) {
        errorMessage = 'The fuel log could not be updated. It may have been deleted or you may not have sufficient permissions.';
      }

      Alert.alert('Error', errorMessage, [
        {
          text: 'OK',
          style: 'default',
        },
        ...(error.includes('no longer exists') ? [{
          text: 'Go Back',
          onPress: () => router.back(),
        }] : [])
      ]);
    } else {
      Alert.alert('Success', 'Fuel log updated successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/logs'),
        },
      ]);
    }
  };

  const isFormValid = () => {
    return (
      formData.cost && formData.cost > 0 &&
      formData.fuel_price && formData.fuel_price > 0 &&
      formData.odometer_reading > 0 &&
      formData.date
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    vehicleInfo: {
      backgroundColor: colors.icon + '10',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    vehicleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.icon,
      marginTop: 2,
    },
    fuelPriceSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    fuelPriceOption: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    fuelPriceOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.tint + '10',
    },
    fuelPriceOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    fuelPriceOptionTextSelected: {
      color: colors.tint,
    },
    inputReadOnly: {
      backgroundColor: colors.icon + '10',
      color: colors.icon,
    },
  });

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Fuel Log</Text>
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
        <Text style={styles.title}>Edit Fuel Log</Text>
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle</Text>
              {(fuelLog as any)?.vehicles && (
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleIcon}>
                    <IconSymbol name="car.fill" size={16} color="white" />
                  </View>
                  <View>
                    <Text style={styles.vehicleText}>
                      {(fuelLog as any).vehicles.year} {(fuelLog as any).vehicles.make} {(fuelLog as any).vehicles.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>{(fuelLog as any).vehicles.license_plate}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Fuel Price (RM per liter) <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <View style={styles.fuelPriceSelector}>
                {[1.99, 2.60, 3.21].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.fuelPriceOption,
                      formData.fuel_price === price && styles.fuelPriceOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData(prev => {
                        const newData = { ...prev, fuel_price: price };
                        
                        // Auto-calculate liters if cost is entered
                        if (prev.cost && prev.cost > 0) {
                          newData.liters_filled = calculateLiters(prev.cost, price);
                        }
                        
                        return newData;
                      });
                    }}
                  >
                    <Text style={[
                      styles.fuelPriceOptionText,
                      formData.fuel_price === price && styles.fuelPriceOptionTextSelected,
                    ]}>
                      RM{price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Cost (RM) <Text style={styles.requiredLabel}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.cost?.toString() || ''}
                    onChangeText={(text) => {
                      const cost = parseFloat(text) || 0;
                      setFormData(prev => {
                        const newData = { ...prev, cost };
                        
                        // Auto-calculate liters if fuel price is selected
                        if (prev.fuel_price && prev.fuel_price > 0 && cost > 0) {
                          newData.liters_filled = calculateLiters(cost, prev.fuel_price);
                        }
                        
                        return newData;
                      });
                    }}
                    placeholder="65.00"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.flex1}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Liters Filled</Text>
                  <TextInput
                    style={[styles.input, styles.inputReadOnly]}
                    value={formData.liters_filled.toString()}
                    placeholder="Auto-calculated"
                    placeholderTextColor={colors.icon}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
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

              <View style={styles.flex1}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
                  placeholder="Select date"
                  required={true}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Petrol station name or location..."
                placeholderTextColor={colors.icon}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}