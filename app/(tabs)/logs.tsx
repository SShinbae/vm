import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MileageLogService, FuelLogService, ServiceLogService } from '@/lib/services/loggingService';
import { MileageLog, FuelLog, ServiceLog } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDate } from '@/lib/utils/dateUtils';

type LogType = 'mileage' | 'fuel' | 'service';

export default function LogsScreen() {
  const [activeTab, setActiveTab] = useState<LogType>('mileage');
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchAllLogs = useCallback(async () => {
    const [mileageResult, fuelResult, serviceResult] = await Promise.all([
      MileageLogService.getMileageLogs(),
      FuelLogService.getFuelLogs(),
      ServiceLogService.getServiceLogs(),
    ]);

    if (mileageResult.data) setMileageLogs(mileageResult.data);
    if (fuelResult.data) setFuelLogs(fuelResult.data);
    if (serviceResult.data) setServiceLogs(serviceResult.data);

    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllLogs();
    setRefreshing(false);
  }, [fetchAllLogs]);

  const handleDeleteLog = async (type: LogType, id: string, description: string) => {
    Alert.alert(
      'Delete Log',
      `Are you sure you want to delete this ${type} log: ${description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            let result;
            switch (type) {
              case 'mileage':
                result = await MileageLogService.deleteMileageLog(id);
                break;
              case 'fuel':
                result = await FuelLogService.deleteFuelLog(id);
                break;
              case 'service':
                result = await ServiceLogService.deleteServiceLog(id);
                break;
            }

            if (result?.error) {
              Alert.alert('Error', `Failed to delete ${type} log`);
            } else {
              await fetchAllLogs();
              Alert.alert('Success', `${type} log deleted successfully`);
            }
          },
        },
      ]
    );
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

  const LogCard = ({ log, type }: { log: any; type: LogType }) => {
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
            title: `${log.liters_filled} L`,
            subtitle: `${log.cost ? `RM${log.cost}` : ''} • ${log.odometer_reading?.toLocaleString()} km`,
            icon: 'fuelpump',
            color: '#4CAF50',
          };
        case 'service':
          return {
            title: log.service_type?.replace('_', ' ').toUpperCase(),
            subtitle: `${log.description} • ${log.cost ? `RM${log.cost}` : ''}`,
            icon: 'wrench',
            color: '#FF9800',
          };
        default:
          return { title: '', subtitle: '', icon: 'doc', color: colors.tint };
      }
    };

    const details = getLogDetails();

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={[styles.logIcon, { backgroundColor: details.color + '20' }]}>
            <IconSymbol name={details.icon} size={20} color={details.color} />
          </View>
          <View style={styles.logInfo}>
            <Text style={styles.logTitle}>{details.title}</Text>
            <Text style={styles.logSubtitle}>{details.subtitle}</Text>
            <Text style={styles.logDate}>
              {formatDate(log.date)} • {(log as any).vehicles?.make} {(log as any).vehicles?.model}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteLog(type, log.id, details.title)}
          >
            <IconSymbol name="trash" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
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
    logTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    logSubtitle: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    logDate: {
      fontSize: 12,
      color: colors.icon,
    },
    deleteButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
            Start tracking your vehicle's {activeTab} to monitor performance and maintenance.
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
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {currentLogs.map((log) => (
            <LogCard key={log.id} log={log} type={activeTab} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}