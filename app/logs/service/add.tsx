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
import { OCRService, ReceiptProcessingResult } from '@/lib/services/ocrService';
import { ServiceLogFormData, ServiceType, OCRExtractedData, ServiceLogItem } from '@/types';
import { VehicleWithDetails } from '@/types/database-v2';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ReceiptCapture, OCRResultDisplay } from '@/components/ui/ReceiptCapture';
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

export default function AddServiceLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: vehicleId || '',
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
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [ocrResult, setOcrResult] = useState<ReceiptProcessingResult | null>(null);
  const [showOcrResult, setShowOcrResult] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
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

    // Validate service items
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

    const logData = {
      vehicle_id: formData.vehicle_id,
      service_type: formData.service_type,
      description: itemsJson, // Store items as JSON for backward compatibility
      cost: totalCost,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
      receipt_image_url: formData.receipt_image_url || undefined,
      ocr_extracted_data: formData.ocr_extracted_data || undefined,
      auto_filled: formData.auto_filled || undefined,
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
    const itemsValid = formData.items && formData.items.length > 0 &&
      formData.items.some(item => item.description.trim() && item.price > 0);

    return (
      formData.vehicle_id &&
      itemsValid &&
      formData.odometer_reading > 0 &&
      formData.date
    );
  };

  const handleReceiptProcessed = async (result: ReceiptProcessingResult) => {
    if (result.success && result.data) {
      setOcrResult(result);
      setShowOcrResult(true);
      if (result.imageUri) {
        setCapturedImageUri(result.imageUri);
      }
    } else {
      Alert.alert('OCR Error', result.error || 'Failed to process receipt');
    }
  };

  const handlePictureOnly = async (result: ReceiptProcessingResult) => {
    if (result.success && result.uploadedImageUrl) {
      // Set the receipt image URL directly without OCR data
      setFormData(prev => ({
        ...prev,
        receipt_image_url: result.uploadedImageUrl || '',
        auto_filled: false,
      }));

      // Set the captured image URI for immediate preview
      if (result.imageUri) {
        setCapturedImageUri(result.imageUri);
      }

      Alert.alert(
        'Picture Saved',
        'The picture has been saved with your service record. You can review it below.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Upload Error', result.error || 'Failed to save picture');
    }
  };

  const handleAcceptOcrData = async () => {
    if (!ocrResult?.data) {
      Alert.alert('Error', 'No OCR data available to apply');
      return;
    }

    try {
      setLoading(true);
      const { extracted_fields } = ocrResult.data;

      // Upload receipt image to storage
      let receiptImageUrl = '';
      if (ocrResult.imageUri) {
        try {
          const uploadResult = await OCRService.uploadReceiptImage(
            ocrResult.imageUri,
            `receipt_${Date.now()}.jpg`
          );

          if (uploadResult.error) {
            console.warn('Failed to upload receipt image:', uploadResult.error);
            Alert.alert(
              'Upload Warning',
              'The receipt image could not be saved, but the extracted data will still be applied. Continue?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                { text: 'Continue', onPress: () => { /* Continue with OCR data application */ } }
              ]
            );
            return;
          }

          if (uploadResult.data) {
            receiptImageUrl = uploadResult.data;
          }
        } catch (error) {
          console.warn('Failed to upload receipt image:', error);
          // Continue without image URL - OCR data is still valuable
        }
      }

    // Map OCR service type to our enum values
    const mapServiceType = (ocrType: string): ServiceType => {
      const typeMap: Record<string, ServiceType> = {
        'oil_change': 'oil_change',
        'tire_rotation': 'tire_rotation',
        'brake_service': 'brake_service',
        'general_maintenance': 'general_maintenance',
        'repair': 'repair',
        'inspection': 'inspection'
      };
      return typeMap[ocrType] || 'general_maintenance';
    };

    // Update form with OCR extracted data
    setFormData(prev => ({
      ...prev,
      service_type: extracted_fields.service_type
        ? mapServiceType(extracted_fields.service_type)
        : prev.service_type,
      description: extracted_fields.description || prev.description,
      cost: extracted_fields.cost || prev.cost,
      date: extracted_fields.date
        ? new Date(extracted_fields.date).toISOString().split('T')[0]
        : prev.date,
      odometer_reading: extracted_fields.odometer_reading || prev.odometer_reading,
      receipt_image_url: receiptImageUrl,
      ocr_extracted_data: ocrResult.data,
      auto_filled: true,
    }));

      setShowOcrResult(false);
      Alert.alert(
        'Data Applied',
        'Service details have been automatically filled from your receipt. Please review and adjust if needed.'
      );
    } catch (error) {
      console.error('Error applying OCR data:', error);
      Alert.alert(
        'Error',
        'Failed to apply the extracted data. You can still enter the information manually.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOcrData = () => {
    setOcrResult(null);
    setShowOcrResult(false);
  };

  const handleDeletePicture = () => {
    setCapturedImageUri(null);
    setFormData(prev => ({
      ...prev,
      receipt_image_url: '',
      ocr_extracted_data: undefined,
      auto_filled: false
    }));
    setOcrResult(null);
    setShowOcrResult(false);
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
    autoFillIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF50' + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
      marginBottom: 16,
    },
    autoFillText: {
      fontSize: 14,
      color: '#4CAF50',
      fontWeight: '500',
    },
    pictureIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tint + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
      marginBottom: 16,
    },
    pictureText: {
      fontSize: 14,
      color: colors.tint,
      fontWeight: '500',
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Receipt/Picture</Text>
              <ReceiptCapture
                onReceiptProcessed={handleReceiptProcessed}
                onPictureOnly={handlePictureOnly}
                disabled={loading}
              />
            </View>

            {capturedImageUri && (
              <View style={styles.inputContainer}>
                <ReceiptViewer
                  receiptImageUrl={capturedImageUri}
                  ocrData={formData.ocr_extracted_data}
                  showOcrData={!!formData.ocr_extracted_data}
                  onDelete={handleDeletePicture}
                />
              </View>
            )}

            {showOcrResult && ocrResult?.data && (
              <OCRResultDisplay
                ocrData={ocrResult.data}
                onAccept={handleAcceptOcrData}
                onReject={handleRejectOcrData}
              />
            )}

            <ServiceTypeSelector />

            {formData.auto_filled && (
              <View style={styles.autoFillIndicator}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4CAF50" />
                <Text style={styles.autoFillText}>
                  Data auto-filled from receipt
                </Text>
              </View>
            )}

            {formData.receipt_image_url && !formData.auto_filled && (
              <View style={styles.pictureIndicator}>
                <IconSymbol name="photo.fill" size={16} color={colors.tint} />
                <Text style={styles.pictureText}>
                  Picture attached to service record
                </Text>
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