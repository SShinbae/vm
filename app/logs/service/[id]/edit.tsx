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
import { ServiceLogFormData, ServiceLog, ServiceType, ServiceLogItem } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ReceiptViewer } from '@/components/ui/ReceiptViewer';
import { ServiceItemsInput, calculateTotalCost, validateServiceItems, createDefaultServiceItems } from '@/components/ui/ServiceItemsInput';

const SERVICE_TYPES: { value: ServiceType; label: string; icon: string }[] = [
  { value: 'oil_change', label: 'Oil Change', icon: 'drop' },
  { value: 'tire_rotation', label: 'Tire Rotation', icon: 'circle' },
  { value: 'brake_service', label: 'Brake Service', icon: 'stop' },
  { value: 'general_maintenance', label: 'General Maintenance', icon: 'wrench' },
  { value: 'repair', label: 'Repair', icon: 'hammer' },
  { value: 'inspection', label: 'Inspection', icon: 'checkmark.shield' },
  { value: 'other', label: 'Other', icon: 'ellipsis' },
];

// Helper function to parse service log description (for backward compatibility)
const parseServiceLogItems = (description: string, cost?: number): ServiceLogItem[] => {
  try {
    // Try to parse as JSON first (new format)
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, treat as legacy single description
  }

  // Legacy format: single description with cost
  if (description.trim()) {
    return [{ description: description.trim(), price: cost || 0 }];
  }

  // Fallback to default
  return createDefaultServiceItems();
};

export default function EditServiceLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [serviceLog, setServiceLog] = useState<ServiceLog | null>(null);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: '',
    service_type: 'general_maintenance',
    description: '',
    cost: 0,
    items: createDefaultServiceItems(),
    date: new Date().toISOString().split('T')[0],
    odometer_reading: 0,
    next_service_due: '',
    receipt_image_url: '',
    ocr_extracted_data: undefined,
    auto_filled: false,
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const fetchServiceLog = async () => {
      if (!id) {
        Alert.alert('Error', 'Invalid service log ID');
        router.back();
        return;
      }

      try {
        const { data: logs, error } = await ServiceLogService.getServiceLogs();
        if (error) {
          Alert.alert('Error', 'Failed to load service log');
          router.back();
          return;
        }

        const log = logs?.find(l => l.id === id);
        if (!log) {
          Alert.alert('Error', 'Service log not found');
          router.back();
          return;
        }

        setServiceLog(log);

        // Parse items from description (with backward compatibility)
        const items = parseServiceLogItems(log.description, log.cost || 0);

        setFormData({
          vehicle_id: log.vehicle_id,
          service_type: log.service_type as ServiceType,
          description: log.description,
          cost: log.cost || 0,
          items: items,
          date: log.date,
          odometer_reading: log.odometer_reading,
          next_service_due: log.next_service_due || '',
          receipt_image_url: log.receipt_image_url || '',
          ocr_extracted_data: log.ocr_extracted_data || undefined,
          auto_filled: log.auto_filled || false,
        });
      } catch (error) {
        console.error('Error fetching service log:', error);
        Alert.alert('Error', 'Failed to load service log');
        router.back();
      }

      setDataLoading(false);
    };

    fetchServiceLog();
  }, [id]);

  const handleSave = async () => {
    // Validation
    const itemsError = validateServiceItems(formData.items || []);
    if (itemsError) {
      Alert.alert('Error', itemsError);
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

    // Calculate total cost and serialize items
    const totalCost = calculateTotalCost(formData.items || []);
    const itemsJson = JSON.stringify(formData.items || []);

    const updateData = {
      service_type: formData.service_type,
      description: itemsJson, // Store items as JSON for backward compatibility
      cost: totalCost,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
      // Don't update receipt_image_url or ocr_extracted_data in edit
    };

    const { data, error } = await ServiceLogService.updateServiceLog(id!, updateData);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Service log updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  };

  const isFormValid = () => {
    const itemsValid = formData.items && formData.items.length > 0 &&
      formData.items.some(item => item.description.trim() && item.price > 0);

    return (
      itemsValid &&
      formData.odometer_reading > 0 &&
      formData.date
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
  });

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Service Log</Text>
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
        <Text style={styles.title}>Edit Service Log</Text>
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
              {serviceLog?.vehicles && (
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleIcon}>
                    <IconSymbol name="car.fill" size={16} color="white" />
                  </View>
                  <View>
                    <Text style={styles.vehicleText}>
                      {serviceLog.vehicles.year} {serviceLog.vehicles.make} {serviceLog.vehicles.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>{serviceLog.vehicles.license_plate}</Text>
                  </View>
                </View>
              )}
            </View>

            <ServiceTypeSelector />

            {formData.receipt_image_url && (
              <View style={styles.inputContainer}>
                <ReceiptViewer
                  receiptImageUrl={formData.receipt_image_url}
                  ocrData={formData.ocr_extracted_data}
                  showOcrData={!!formData.ocr_extracted_data}
                />
              </View>
            )}

            <ServiceItemsInput
              items={formData.items || []}
              onItemsChange={(items) => setFormData(prev => ({ ...prev, items }))}
            />

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