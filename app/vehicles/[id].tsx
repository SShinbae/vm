import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { VehicleService } from '@/lib/services/vehicleService';
import { VehicleWithLogs } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleWithLogs | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchVehicleData = useCallback(async () => {
    if (!id) return;

    const [vehicleResult, statsResult] = await Promise.all([
      VehicleService.getVehicleById(id),
      VehicleService.getVehicleStats(id),
    ]);

    if (vehicleResult.error) {
      Alert.alert('Error', 'Failed to load vehicle details');
      router.back();
    } else if (vehicleResult.data) {
      setVehicle(vehicleResult.data);
      setStats(statsResult);
    }

    setLoading(false);
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicleData();
    setRefreshing(false);
  }, [fetchVehicleData]);

  const handleDelete = () => {
    if (!vehicle) return;

    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone and will delete all associated logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await VehicleService.deleteVehicle(vehicle.id);
            if (error) {
              Alert.alert('Error', 'Failed to delete vehicle');
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  const StatCard = ({ title, value, subtitle, icon }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <IconSymbol name={icon} size={20} color={colors.tint} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const LogSection = ({ title, logs, icon, onAddPress }: any) => (
    <View style={styles.logSection}>
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>{title}</Text>
        <TouchableOpacity style={styles.addLogButton} onPress={onAddPress}>
          <IconSymbol name="plus" size={16} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {logs && logs.length > 0 ? (
        logs.slice(0, 3).map((log: any, index: number) => (
          <View key={index} style={styles.logItem}>
            <View style={styles.logIcon}>
              <IconSymbol name={icon} size={16} color={colors.icon} />
            </View>
            <View style={styles.logContent}>
              <Text style={styles.logText}>
                {log.odometer_reading?.toLocaleString()} km
              </Text>
              <Text style={styles.logDate}>
                {new Date(log.date || log.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noLogsText}>No {title.toLowerCase()} recorded yet</Text>
      )}

      {logs && logs.length > 3 && (
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View all {logs.length} entries</Text>
          <IconSymbol name="chevron.right" size={14} color={colors.tint} />
        </TouchableOpacity>
      )}
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
    headerButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    vehicleCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    vehicleIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    vehiclePlate: {
      fontSize: 16,
      color: colors.icon,
      fontWeight: '500',
    },
    vehicleDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    statTitle: {
      fontSize: 12,
      color: colors.icon,
      fontWeight: '500',
    },
    statSubtitle: {
      fontSize: 10,
      color: colors.icon,
      marginTop: 2,
    },
    logSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    logTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    addLogButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    logIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.icon + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    logContent: {
      flex: 1,
    },
    logText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    logDate: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 2,
    },
    noLogsText: {
      fontSize: 14,
      color: colors.icon,
      textAlign: 'center',
      paddingVertical: 16,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.icon + '10',
      marginTop: 8,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.tint,
      fontWeight: '500',
      marginRight: 4,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Vehicle Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Vehicle Not Found</Text>
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
        <Text style={styles.title} numberOfLines={1}>
          {vehicle.make} {vehicle.model}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/vehicles/${vehicle.id}/edit` as any)}
          >
            <IconSymbol name="pencil" size={20} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <IconSymbol name="trash" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <IconSymbol name="car.fill" size={28} color="white" />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
            </View>
          </View>

          <View style={styles.vehicleDetails}>
            {vehicle.vin && (
              <View style={styles.detailItem}>
                <IconSymbol name="number" size={14} color={colors.icon} />
                <Text style={styles.detailLabel}>VIN:</Text>
                <Text style={styles.detailValue}>{vehicle.vin}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <IconSymbol name="calendar" size={14} color={colors.icon} />
              <Text style={styles.detailLabel}>Added:</Text>
              <Text style={styles.detailValue}>
                {new Date(vehicle.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Current Mileage"
            value={stats?.currentMileage ? `${stats.currentMileage.toLocaleString()} km` : '—'}
            icon="speedometer"
          />
          <StatCard
            title="Fuel Records"
            value={vehicle.fuel_logs?.length || 0}
            subtitle="fill-ups recorded"
            icon="fuelpump"
          />
          <StatCard
            title="Service Records"
            value={vehicle.service_logs?.length || 0}
            subtitle="services completed"
            icon="wrench"
          />
          <StatCard
            title="Mileage Records"
            value={vehicle.mileage_logs?.length || 0}
            subtitle="readings logged"
            icon="chart.line.uptrend.xyaxis"
          />
        </View>

        <LogSection
          title="Recent Mileage"
          logs={vehicle.mileage_logs}
          icon="speedometer"
          onAddPress={() => router.push(`/logs/mileage/add?vehicleId=${vehicle.id}` as any)}
        />

        <LogSection
          title="Recent Fuel"
          logs={vehicle.fuel_logs}
          icon="fuelpump"
          onAddPress={() => router.push(`/logs/fuel/add?vehicleId=${vehicle.id}` as any)}
        />

        <LogSection
          title="Recent Service"
          logs={vehicle.service_logs}
          icon="wrench"
          onAddPress={() => router.push(`/logs/service/add?vehicleId=${vehicle.id}` as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}