import { IconSymbol } from '@/components/ui/icon-symbol';
import { ReceiptViewer } from '@/components/ui/ReceiptViewer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ServiceLogService } from '@/lib/services/loggingService';
import { ServiceLog, ServiceType } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: 'Oil Change',
  tire_rotation: 'Tire Rotation',
  brake_service: 'Brake Service',
  general_maintenance: 'General Maintenance',
  repair: 'Repair',
  inspection: 'Inspection',
  other: 'Other',
};

const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  oil_change: 'drop',
  tire_rotation: 'circle',
  brake_service: 'stop',
  general_maintenance: 'wrench',
  repair: 'hammer',
  inspection: 'checkmark.shield',
  other: 'ellipsis',
};

export default function ServiceLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [serviceLog, setServiceLog] = useState<ServiceLog | null>(null);
  const [loading, setLoading] = useState(true);
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
      } catch (error) {
        console.error('Error fetching service log:', error);
        Alert.alert('Error', 'Failed to load service log');
        router.back();
      }

      setLoading(false);
    };

    fetchServiceLog();
  }, [id]);

  const handleEdit = () => {
    router.push(`/logs/service/${id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Service Log',
      'Are you sure you want to delete this service log? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await ServiceLogService.deleteServiceLog(id!);
              if (error) {
                Alert.alert('Error', error);
              } else {
                Alert.alert('Success', 'Service log deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Error deleting service log:', error);
              Alert.alert('Error', 'Failed to delete service log');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
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
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deleteButton: {
      backgroundColor: '#F44336',
    },
    actionButtonText: {
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
    card: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      marginBottom: 16,
    },
    serviceTypeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    serviceTypeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceTypeInfo: {
      flex: 1,
    },
    serviceTypeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    serviceTypeSubtitle: {
      fontSize: 16,
      color: colors.icon,
      marginTop: 2,
    },
    vehicleInfo: {
      backgroundColor: colors.icon + '10',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
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
    detailSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '10',
    },
    detailLabel: {
      fontSize: 16,
      color: colors.icon,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
      marginLeft: 16,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      backgroundColor: colors.icon + '05',
      padding: 16,
      borderRadius: 8,
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
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Service Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!serviceLog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Service Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.detailLabel, { textAlign: 'center' }]}>
            Service log not found
          </Text>
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
        <Text style={styles.title}>Service Details</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <IconSymbol name="pencil" size={14} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <IconSymbol name="trash" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.serviceTypeHeader}>
            <View style={styles.serviceTypeIcon}>
              <IconSymbol
                name={SERVICE_TYPE_ICONS[serviceLog.service_type as ServiceType]}
                size={24}
                color="white"
              />
            </View>
            <View style={styles.serviceTypeInfo}>
              <Text style={styles.serviceTypeTitle}>
                {SERVICE_TYPE_LABELS[serviceLog.service_type as ServiceType]}
              </Text>
              <Text style={styles.serviceTypeSubtitle}>
                {formatDate(serviceLog.date)}
              </Text>
            </View>
          </View>

          {serviceLog.vehicles && (
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

          {serviceLog.auto_filled && (
            <View style={styles.autoFillIndicator}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#4CAF50" />
              <Text style={styles.autoFillText}>
                Data auto-filled from receipt
              </Text>
            </View>
          )}
        </View>

        {serviceLog.receipt_image_url && (
          <View style={styles.card}>
            <ReceiptViewer
              receiptImageUrl={serviceLog.receipt_image_url}
              ocrData={serviceLog.ocr_extracted_data}
              showOcrData={!!serviceLog.ocr_extracted_data}
            />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Service Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
            </View>
            <Text style={styles.description}>{serviceLog.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Service Information</Text>

            {serviceLog.cost && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cost</Text>
                <Text style={styles.detailValue}>{formatCurrency(serviceLog.cost)}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Odometer Reading</Text>
              <Text style={styles.detailValue}>{serviceLog.odometer_reading.toLocaleString()} km</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(serviceLog.date)}</Text>
            </View>

            {serviceLog.next_service_due && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Service Due</Text>
                <Text style={styles.detailValue}>{formatDate(serviceLog.next_service_due)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}