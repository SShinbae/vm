import { IconSymbol } from '@/components/ui/icon-symbol';
import { AlertModal, ConfirmModal } from '@/components/ui/Modal';
import { ServiceReceiptIndicator } from '@/components/ui/ReceiptViewer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FuelLogService, MileageLogService, ServiceLogService } from '@/lib/services/loggingService';
import { safePromiseAll, isFulfilled } from '@/lib/utils/networkUtils';
import { formatDate } from '@/lib/utils/dateUtils';
import { canUserAccessVehicle, formatServiceItems } from '@/lib/utils/serviceUtils';
import { supabase } from '@/services/supabaseClient';
import { FuelLog, MileageLog, ServiceLog } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LogType = 'mileage' | 'fuel' | 'service';

export default function LogsScreen() {
  const [activeTab, setActiveTab] = useState<LogType>('mileage');
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<{type: LogType, id: string, description: string} | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertVariant, setAlertVariant] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Helper function to check if user can modify a log
  const canUserModifyLog = async (log: any): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return false;

      // Use the standardized permission function
      return await canUserAccessVehicle(log.vehicle_id, user.id);
    } catch (error) {
      console.error('Error checking modify permission:', error);
      return false;
    }
  };

  const fetchAllLogs = useCallback(async () => {
    try {
      // Use network utility for safe promise handling with timeout protection
      const results = await safePromiseAll([
        MileageLogService.getMileageLogs(),
        FuelLogService.getFuelLogs(),
        ServiceLogService.getServiceLogs(),
      ], 8000);

      // Process results individually using utility type guards
      const [mileageResult, fuelResult, serviceResult] = results;

      if (isFulfilled(mileageResult) && mileageResult.value.data) {
        setMileageLogs(mileageResult.value.data);
      } else {
        console.warn('Failed to fetch mileage logs:', mileageResult.status === 'rejected' ? mileageResult.reason : 'No data');
        setMileageLogs([]);
      }

      if (isFulfilled(fuelResult) && fuelResult.value.data) {
        setFuelLogs(fuelResult.value.data);
      } else {
        console.warn('Failed to fetch fuel logs:', fuelResult.status === 'rejected' ? fuelResult.reason : 'No data');
        setFuelLogs([]);
      }

      if (isFulfilled(serviceResult) && serviceResult.value.data) {
        setServiceLogs(serviceResult.value.data);
      } else {
        console.warn('Failed to fetch service logs:', serviceResult.status === 'rejected' ? serviceResult.reason : 'No data');
        setServiceLogs([]);
      }

    } catch (error) {
      console.error('Error fetching logs:', error);
      // Set empty arrays on error to prevent infinite loading
      setMileageLogs([]);
      setFuelLogs([]);
      setServiceLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllLogs();
    setRefreshing(false);
  }, [fetchAllLogs]);

  const handleDeleteLog = (type: LogType, id: string, description: string) => {
    setSelectedLog({ type, id, description });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLog) return;

    setDeleteLoading(true);

    let result;
    switch (selectedLog.type) {
      case 'mileage':
        result = await MileageLogService.deleteMileageLog(selectedLog.id);
        break;
      case 'fuel':
        result = await FuelLogService.deleteFuelLog(selectedLog.id);
        break;
      case 'service':
        result = await ServiceLogService.deleteServiceLog(selectedLog.id);
        break;
    }

    setDeleteLoading(false);
    setDeleteModalVisible(false);

    if (result?.error) {
      console.error(`Error deleting ${selectedLog.type} log:`, result.error);

      // Provide more specific error messages based on the error content
      let errorMessage = result.error;
      if (result.error.includes('not found') || result.error.includes('Log not found')) {
        errorMessage = `This ${selectedLog.type} log no longer exists. It may have been deleted by another user.`;
      } else if (result.error === 'PERMISSION_DENIED_SHARED_VEHICLE') {
        errorMessage = `This ${selectedLog.type} log belongs to a shared vehicle. You can view it but cannot modify or delete it.`;
      } else if (result.error === 'PERMISSION_DENIED_ACCESS') {
        errorMessage = `You do not have permission to delete this ${selectedLog.type} log.`;
      } else if (result.error.includes('Access denied') || result.error.includes('not authenticated')) {
        errorMessage = `You do not have permission to delete this ${selectedLog.type} log.`;
      } else if (result.error.includes('Failed to delete')) {
        errorMessage = `Unable to delete ${selectedLog.type} log. Please check your internet connection and try again.`;
      }

      showAlert('Error', errorMessage, 'error');

      // Refresh the logs to ensure UI is in sync with actual state
      await fetchAllLogs();
    } else if (result?.data === true) {
      // Only show success if the deletion actually succeeded
      await fetchAllLogs();
      showAlert('Success', `${selectedLog.type} log deleted successfully`, 'success');
    } else {
      // Handle unexpected response (not error, but not successful either)
      console.warn(`Unexpected response when deleting ${selectedLog.type} log:`, result);
      showAlert('Warning', `${selectedLog.type} log deletion status unclear. Please refresh to see current state.`, 'warning');
      await fetchAllLogs();
    }

    setSelectedLog(null);
  };

  const showAlert = (title: string, message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVariant(variant);
    setAlertModalVisible(true);
  };

  const handleViewServiceDetail = (serviceId: string) => {
    router.push(`/logs/service/${serviceId}` as any);
  };

  const handleEditLog = (type: LogType, id: string) => {
    switch (type) {
      case 'mileage':
        router.push(`/logs/mileage/${id}/edit` as any);
        break;
      case 'fuel':
        router.push(`/logs/fuel/${id}/edit` as any);
        break;
      case 'service':
        router.push(`/logs/service/${id}/edit` as any);
        break;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllLogs();
    }, [fetchAllLogs])
  );

  const TabButton = ({ type, label, icon }: { type: LogType; label: string; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === type && { backgroundColor: colors.tint, borderColor: colors.tint },
      ]}
      onPress={() => setActiveTab(type)}
    >
      <IconSymbol
        name={icon}
        size={20}
        color={activeTab === type ? 'white' : colors.icon}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === type ? 'white' : colors.icon },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const VehicleHeader = ({ vehicle, isSharedVehicle }: { vehicle: any; isSharedVehicle: boolean }) => (
    <View style={styles.vehicleHeader}>
      {vehicle?.main_image_url ? (
        <Image
          source={{ uri: vehicle.main_image_url }}
          style={[styles.vehicleHeaderImage, isSharedVehicle && styles.sharedVehicleHeaderImage]}
        />
      ) : (
        <View style={[styles.vehicleHeaderIcon, isSharedVehicle && styles.sharedVehicleHeaderIcon]}>
          <IconSymbol
            name={isSharedVehicle ? "person.2.fill" : "car.fill"}
            size={20}
            color="white"
          />
        </View>
      )}
      <View style={styles.vehicleHeaderInfo}>
        <View style={styles.vehicleHeaderTitleRow}>
          <Text style={styles.vehicleHeaderTitle}>
            {vehicle?.year} {vehicle?.make} {vehicle?.model}
          </Text>
          {isSharedVehicle && (
            <View style={styles.sharedVehicleBadge}>
              <IconSymbol name="person.2.fill" size={12} color={colors.tint} />
              <Text style={styles.sharedVehicleBadgeText}>Shared</Text>
            </View>
          )}
        </View>
        {vehicle?.license_plate && (
          <Text style={styles.vehicleHeaderPlate}>{vehicle.license_plate}</Text>
        )}
      </View>
    </View>
  );

  const LogCard = ({ log, type }: { log: any; type: LogType }) => {
    const [canModify, setCanModify] = useState<boolean | null>(null);

    // Check modification permissions when component mounts
    useEffect(() => {
      const checkPermissions = async () => {
        const hasPermission = await canUserModifyLog(log);
        setCanModify(hasPermission);
      };
      checkPermissions();
    }, [log]);
    const getLogDetails = () => {
      switch (type) {
        case 'mileage':
          return {
            title: `${log.odometer_reading?.toLocaleString()} km`,
            subtitle: log.notes || 'Mileage reading',
            icon: 'speedometer',
            color: '#2196F3',
          };
        case 'fuel':
          return {
            title: `${log.cost ? `RM${log.cost}` : ''} `,
            subtitle: `${log.liters_filled} L`,
            odometer: log.odometer_reading ? `${log.odometer_reading.toLocaleString()} km` : null,
            icon: 'fuelpump',
            color: '#4CAF50',
          };
        case 'service':
          return {
            title: log.service_type?.replace('_', ' ').toUpperCase(),
            subtitle: `${formatServiceItems(log.description)}${log.cost ? ` • RM${log.cost}` : ''}`,
            icon: 'wrench',
            color: '#FF9800',
            hasReceipt: !!log.receipt_image_url,
            receiptUrl: log.receipt_image_url,
          };
        default:
          return { title: '', subtitle: '', icon: 'doc', color: colors.tint };
      }
    };

    const details = getLogDetails();
    const isSharedVehicle = log.is_shared_vehicle || false;

    const handleCardPress = () => {
      if (type === 'service') {
        handleViewServiceDetail(log.id);
      } else {
        handleEditLog(type, log.id);
      }
    };

    return (
      <TouchableOpacity
        style={[styles.logCard, isSharedVehicle && styles.sharedLogCard]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.logHeader}>
          <View style={[styles.logIcon, { backgroundColor: details.color + '20' }]}>
            <IconSymbol name={details.icon} size={20} color={details.color} />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logTitle}>{details.title}</Text>
              {type === 'service' && details.hasReceipt && (
                <ServiceReceiptIndicator
                  hasReceipt={details.hasReceipt}
                  receiptUrl={details.receiptUrl}
                  onPress={() => handleViewServiceDetail(log.id)}
                  size={18}
                />
              )}
            </View>
            {/* <Text style={styles.logSubtitle}>{details.subtitle}</Text> */}
            <Text style={styles.logSubtitle}>{details.subtitle}</Text>
{details.odometer && (
  <Text style={styles.logOdometer}>{details.odometer}</Text>
)}
            <Text style={styles.logDate}>
              {formatDate(log.date)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            {canModify === null ? (
              // Loading state - show placeholder
              <View style={styles.actionLoading}>
                <ActivityIndicator size="small" color={colors.icon} />
              </View>
            ) : canModify ? (
              // User can modify - show edit and delete buttons
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditLog(type, log.id);
                  }}
                >
                  <IconSymbol name="pencil" size={18} color={colors.tint} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteLog(type, log.id, details.title);
                  }}
                >
                  <IconSymbol name="trash" size={18} color="#ff4444" />
                </TouchableOpacity>
              </>
            ) : (
              // Read-only log - show indicator
              <View style={styles.readOnlyIndicator}>
                <IconSymbol name="eye" size={18} color={colors.icon} />
                <Text style={styles.readOnlyText}>View Only</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCurrentLogs = () => {
    switch (activeTab) {
      case 'mileage':
        return mileageLogs;
      case 'fuel':
        return fuelLogs;
      case 'service':
        return serviceLogs;
      default:
        return [];
    }
  };

  const getGroupedLogsByVehicle = () => {
    const logs = getCurrentLogs();
    const grouped: { [vehicleId: string]: { vehicle: any; logs: any[] } } = {};

    logs.forEach(log => {
      const vehicleId = log.vehicle_id;
      const vehicle = (log as any).vehicles;

      if (!grouped[vehicleId]) {
        grouped[vehicleId] = {
          vehicle,
          logs: []
        };
      }

      grouped[vehicleId].logs.push(log);
    });

    // Sort logs within each vehicle group by date (newest first)
    Object.values(grouped).forEach(group => {
      group.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return grouped;
  };

  const getAddRoute = () => {
    switch (activeTab) {
      case 'mileage':
        return '/logs/mileage/add';
      case 'fuel':
        return '/logs/fuel/add';
      case 'service':
        return '/logs/service/add';
      default:
        return '/logs/mileage/add';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    addButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      backgroundColor: colors.background,
      gap: 8,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.icon + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.icon,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    emptyButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    logCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sharedLogCard: {
      borderColor: colors.tint + '40',
      backgroundColor: colors.tint + '05',
    },
    logHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    logIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    logInfo: {
      flex: 1,
    },
    logTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    logTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    sharedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tint + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 4,
    },
    sharedBadgeText: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.tint,
    },
    logSubtitle: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    logOdometer: {
      fontSize: 13,
      color: colors.icon + '80',
      marginBottom: 4,
    },
    logDate: {
      fontSize: 12,
      // color: colors.icon,
      color: colors.icon + '80',
    },
    ownedByText: {
      fontSize: 11,
      color: colors.tint,
      fontStyle: 'italic',
    },
    actionButtons: {
      flexDirection: 'column',
      gap: 8,
    },
    editButton: {
      padding: 8,
    },
    deleteButton: {
      padding: 8,
    },
    actionLoading: {
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readOnlyIndicator: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      opacity: 0.6,
    },
    readOnlyText: {
      fontSize: 10,
      color: colors.icon,
      marginTop: 2,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '10',
      marginTop: 12,
    },
    vehicleHeaderIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    vehicleHeaderImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      backgroundColor: colors.icon + '20',
    },
    sharedVehicleHeaderIcon: {
      backgroundColor: '#4CAF50',
    },
    sharedVehicleHeaderImage: {
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
    vehicleHeaderInfo: {
      flex: 1,
    },
    vehicleHeaderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    vehicleHeaderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    sharedVehicleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tint + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 4,
    },
    sharedVehicleBadgeText: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.tint,
    },
    vehicleHeaderPlate: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: '500',
    },
    vehicleLogsSection: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Logs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const currentLogs = getCurrentLogs();
  const groupedLogs = getGroupedLogsByVehicle();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(getAddRoute() as any)}
        >
          <IconSymbol name="plus" size={16} color="white" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TabButton type="mileage" label="Mileage" icon="speedometer" />
        <TabButton type="fuel" label="Fuel" icon="fuelpump" />
        <TabButton type="service" label="Service" icon="wrench" />
      </View>

      {currentLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <IconSymbol
              name={activeTab === 'mileage' ? 'speedometer' : activeTab === 'fuel' ? 'fuelpump' : 'wrench'}
              size={32}
              color={colors.icon}
            />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab} logs yet</Text>
          <Text style={styles.emptyDescription}>
            Start tracking your vehicle&apos;s {activeTab} to monitor performance and maintenance.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push(getAddRoute() as any)}
          >
            <IconSymbol name="plus" size={16} color="white" />
            <Text style={styles.emptyButtonText}>Add {activeTab} log</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedLogs).map(([vehicleId, { vehicle, logs }]) => {
            const isSharedVehicle = logs.length > 0 && (logs[0].is_shared_vehicle || false);

            return (
              <View key={vehicleId}>
                <VehicleHeader vehicle={vehicle} isSharedVehicle={isSharedVehicle} />
                <View style={styles.vehicleLogsSection}>
                  {logs.map((log) => (
                    <LogCard key={log.id} log={log} type={activeTab} />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalVisible(false);
            setSelectedLog(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Log"
        message={selectedLog ? `Are you sure you want to delete this ${selectedLog.type} log: ${selectedLog.description}?` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />

      <AlertModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        title={alertTitle}
        message={alertMessage}
        variant={alertVariant}
      />
    </SafeAreaView>
  );
}