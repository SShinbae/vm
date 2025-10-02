import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { AlertModal } from '@/components/ui/Modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FuelLogService } from '@/lib/services/loggingService';
import { FuelLog, FuelLogFormData } from '@/types';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';

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
        setErrorMessage('Invalid fuel log ID');
        setShowErrorModal(true);
        router.back();
        return;
      }

      try {
        const { data: logs, error } = await FuelLogService.getFuelLogs();
        if (error) {
          console.error('Error fetching fuel logs:', error);
          let errorMsg = 'Failed to load fuel log';
          if (error.includes('User not authenticated')) {
            errorMsg = 'Your session has expired. Please log in again.';
          } else if (error.includes('Failed to fetch')) {
            errorMsg = 'Unable to load fuel log. Please check your internet connection.';
          }
          setErrorMessage(errorMsg);
          setShowErrorModal(true);
          router.back();
          return;
        }

        const log = logs?.find(l => l.id === id);
        if (!log) {
          console.error('No fuel log found with ID:', id);
          setErrorMessage('This fuel log no longer exists. It may have been deleted.');
          setShowErrorModal(true);
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
        setErrorMessage('Failed to load fuel log');
        setShowErrorModal(true);
        router.back();
      }

      setDataLoading(false);
    };

    fetchFuelLog();
  }, [id]);

  const handleSave = async () => {
    // Validation
    if (!formData.cost || formData.cost <= 0) {
      setErrorMessage('Please enter a valid cost amount');
      setShowErrorModal(true);
      return;
    }
    if (!formData.fuel_price || formData.fuel_price <= 0) {
      setErrorMessage('Please select a fuel price');
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
      let errorMsg = error;
      if (error.includes('not found') || error.includes('no longer exists')) {
        errorMsg = 'This fuel log no longer exists. It may have been deleted by another user.';
      } else if (error.includes('Access denied') || error.includes('permission')) {
        errorMsg = 'You do not have permission to edit this fuel log. Please contact the vehicle owner if this is a shared vehicle.';
      } else if (error.includes('User not authenticated')) {
        errorMsg = 'Your session has expired. Please log in again.';
      } else if (error.includes('Failed to update fuel log')) {
        errorMsg = 'Unable to save changes. Please check your internet connection and try again.';
      } else if (error.includes('could not be updated')) {
        errorMsg = 'The fuel log could not be updated. It may have been deleted or you may not have sufficient permissions.';
      }

      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/(tabs)/logs');
  };

  const validateCost = (value: string) => {
    const cost = parseFloat(value);
    if (isNaN(cost) || cost <= 0) {
      return 'Please enter a valid cost amount';
    }
    return undefined;
  };

  const validateOdometer = (value: string) => {
    const reading = parseInt(value.replace(/,/g, ''));
    if (isNaN(reading) || reading <= 0) {
      return 'Please enter a valid odometer reading';
    }
    return undefined;
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
    section: {
      marginBottom: 24,
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
    row: {
      flexDirection: isWeb ? 'row' : 'column',
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
  });

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {!isWeb && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Fuel Log</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Fuel Log</Text>
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
              <Text style={styles.title}>Edit Fuel Log</Text>
              <Text style={styles.subtitle}>Update your fuel log details</Text>
            </>
          )}

          <View style={styles.card}>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fuel Details</Text>

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
                  <Input
                    label="Cost (RM)"
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
                    keyboardType="numeric"
                    required
                    error={formData.cost ? validateCost(formData.cost.toString()) : undefined}
                    leftIcon="dollarsign"
                  />
                </View>

                <View style={styles.flex1}>
                  <Input
                    label="Liters Filled"
                    value={formData.liters_filled.toString()}
                    placeholder="Auto-calculated"
                    editable={false}
                    helperText="Calculated from cost and fuel price"
                    leftIcon="drop"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Odometer (km)"
                    value={formData.odometer_reading.toString()}
                    onChangeText={(text) => {
                      const reading = parseInt(text.replace(/,/g, '')) || 0;
                      setFormData(prev => ({ ...prev, odometer_reading: reading }));
                    }}
                    placeholder="150,000"
                    keyboardType="numeric"
                    required
                    error={formData.odometer_reading ? validateOdometer(formData.odometer_reading.toString()) : undefined}
                    leftIcon="speedometer"
                  />
                </View>

                <View style={styles.flex1}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    placeholder="Select date"
                    required
                    style={{ marginBottom: 0 }}
                  />
                </View>
              </View>

              <Input
                label="Location (Optional)"
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Petrol station name or location..."
                leftIcon="location"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                icon="xmark"
                style={styles.cancelButton}
              />
              <Button
                title="Save Changes"
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
        message="Fuel log updated successfully!"
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