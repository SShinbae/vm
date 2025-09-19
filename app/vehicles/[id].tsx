import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { VehicleServiceV2 } from '@/lib/services/vehicleServiceV2';
import { formatDate, formatDateWithPrefix } from '@/lib/utils/dateUtils';
import { VehicleWithDetails } from '@/types/database-v2';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchVehicleData = useCallback(async () => {
    if (!id) return;

    try {
      // Using VehicleServiceV2.getVehicleById for more detailed data
      const vehicleResult = await VehicleServiceV2.getVehicleById(id);

      if (vehicleResult.error) {
        console.error('Error fetching vehicle:', vehicleResult.error);
        Alert.alert('Error', 'Failed to load vehicle details');
        router.back();
      } else if (vehicleResult.data) {
        setVehicle(vehicleResult.data);
      } else {
        Alert.alert('Error', 'Vehicle not found');
        router.back();
      }
    } catch (error) {
      console.error('Unexpected error fetching vehicle data:', error);
      Alert.alert('Error', 'Failed to load vehicle details');
      router.back();
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
            const { error } = await VehicleServiceV2.deleteVehicle(vehicle.id);
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

  const handleToggleSharing = async (shared: boolean) => {
    if (!vehicle || sharingLoading) return;

    if (shared) {
      // When turning on sharing, get user's groups and share with all
      Alert.alert(
        'Vehicle Sharing',
        'In the new selective sharing system, you can choose specific groups to share with. For now, this will share with all your groups.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share with All Groups',
            onPress: async () => {
              setSharingLoading(true);
              try {
                // Get user's groups
                const { data: groups, error: groupsError } = await VehicleServiceV2.getUserGroups();

                if (groupsError || !groups || groups.length === 0) {
                  Alert.alert('Error', 'No groups found. You need to be a member of at least one group to share vehicles.');
                  return;
                }

                // Share with all groups
                const groupIds = groups.map(group => group.id);
                const { error: shareError } = await VehicleServiceV2.shareVehicleWithGroups(vehicle.id, groupIds);

                if (shareError) {
                  Alert.alert('Error', 'Failed to share vehicle: ' + shareError);
                } else {
                  // Update local state with actual data
                  setVehicle(prev => prev ? {
                    ...prev,
                    sharing_info: {
                      is_shared: true,
                      shared_with_groups: groups.map(g => g.name),
                      total_shares: groups.length
                    }
                  } : null);
                  Alert.alert('Success', `Vehicle shared with ${groups.length} group(s)`);
                }
              } catch (error) {
                console.error('Error sharing vehicle:', error);
                Alert.alert('Error', 'Failed to share vehicle');
              } finally {
                setSharingLoading(false);
              }
            }
          }
        ]
      );
    } else {
      // When turning off sharing, remove all shares
      setSharingLoading(true);
      try {
        const { error } = await VehicleServiceV2.shareVehicleWithGroups(vehicle.id, []);

        if (error) {
          Alert.alert('Error', 'Failed to stop sharing');
        } else {
          setVehicle(prev => prev ? {
            ...prev,
            sharing_info: {
              is_shared: false,
              shared_with_groups: [],
              total_shares: 0
            }
          } : null);
          Alert.alert('Success', 'Vehicle is no longer shared');
        }
      } catch {
        Alert.alert('Error', 'Failed to update sharing settings');
      } finally {
        setSharingLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  // Refresh data when screen comes into focus (e.g., after adding a new log)
  useFocusEffect(
    useCallback(() => {
      if (vehicle) {
        // Only refresh if we already have vehicle data loaded
        fetchVehicleData();
      }
    }, [fetchVehicleData, vehicle])
  );

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

  const LogSection = ({ title, logs, icon, onAddPress, showAddButton = true, isReadOnly = false }: any) => (
    <View style={styles.logSection}>
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>
          {title}
          {isReadOnly && <Text style={styles.readOnlyIndicator}> (Shared)</Text>}
        </Text>
        {showAddButton && (
          <TouchableOpacity style={styles.addLogButton} onPress={onAddPress}>
            <IconSymbol name="plus" size={16} color={colors.tint} />
          </TouchableOpacity>
        )}
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
                {formatDate(log.date || log.created_at)}
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
    vehicleActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginTop: 40,
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
    sharingCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    sharingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sharingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    sharingInfo: {
      flex: 1,
      marginRight: 16,
    },
    sharingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    sharingDescription: {
      fontSize: 14,
      color: colors.icon,
      lineHeight: 20,
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
    readOnlyIndicator: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.icon,
      fontStyle: 'italic',
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Vehicle not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

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
            <View style={styles.vehicleActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/vehicles/${vehicle.id}/edit` as any)}
              >
                <IconSymbol name="pencil" size={18} color={colors.tint} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <IconSymbol name="trash" size={18} color="#ff4444" />
              </TouchableOpacity>
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
                {formatDateWithPrefix(vehicle.created_at, 'Added')}
              </Text>
            </View>
          </View>
        </View>

        {vehicle.is_own_vehicle && (
          <View style={styles.sharingCard}>
            <View style={styles.sharingHeader}>
              <View style={styles.sharingIcon}>
                <IconSymbol name="person.3.fill" size={20} color={colors.tint} />
              </View>
              <View style={styles.sharingInfo}>
                <Text style={styles.sharingTitle}>Share with Groups</Text>
                <Text style={styles.sharingDescription}>
                  Allow members of your groups to view this vehicle and its logs
                </Text>
              </View>
              <Switch
                value={vehicle.sharing_info?.is_shared || false}
                onValueChange={handleToggleSharing}
                disabled={sharingLoading}
                trackColor={{
                  false: colors.icon + '30',
                  true: colors.tint + '50'
                }}
                thumbColor={vehicle.sharing_info?.is_shared ? colors.tint : colors.background}
              />
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard
            title="Current Mileage"
            value={(() => {
              // Try current_mileage first, then latest mileage log, then show no data
              const currentMileage = vehicle.current_mileage && vehicle.current_mileage > 0
                ? vehicle.current_mileage
                : vehicle.logs?.latest_mileage?.odometer_reading;

              return currentMileage ? `${currentMileage.toLocaleString()} km` : 'No data';
            })()}
            icon="speedometer"
          />
          <StatCard
            title="Fuel Records"
            value={(() => {
              if (vehicle.logs?.counts?.access_status?.fuel_accessible === false) {
                return vehicle.logs.counts.access_status.has_permission_issues ? 'Access Limited' : 'Error';
              }
              return vehicle.logs?.counts?.fuel_count !== undefined ?
                `${vehicle.logs.counts.fuel_count} ${vehicle.logs.counts.fuel_count === 1 ? 'record' : 'records'}` :
                'N/A';
            })()}
            subtitle={vehicle.logs?.latest_fuel ? `Latest: ${formatDate(vehicle.logs.latest_fuel.date)}` : 'No records'}
            icon="fuelpump"
          />
          <StatCard
            title="Service Records"
            value={(() => {
              if (vehicle.logs?.counts?.access_status?.service_accessible === false) {
                return vehicle.logs.counts.access_status.has_permission_issues ? 'Access Limited' : 'Error';
              }
              return vehicle.logs?.counts?.service_count !== undefined ?
                `${vehicle.logs.counts.service_count} ${vehicle.logs.counts.service_count === 1 ? 'record' : 'records'}` :
                'N/A';
            })()}
            subtitle={vehicle.logs?.latest_service ? `Latest: ${formatDate(vehicle.logs.latest_service.date)}` : 'No records'}
            icon="wrench"
          />
          <StatCard
            title="Mileage Records"
            value={(() => {
              if (vehicle.logs?.counts?.access_status?.mileage_accessible === false) {
                return vehicle.logs.counts.access_status.has_permission_issues ? 'Access Limited' : 'Error';
              }
              return vehicle.logs?.counts?.mileage_count !== undefined ?
                `${vehicle.logs.counts.mileage_count} ${vehicle.logs.counts.mileage_count === 1 ? 'record' : 'records'}` :
                'N/A';
            })()}
            subtitle={vehicle.logs?.latest_mileage ? `Latest: ${formatDate(vehicle.logs.latest_mileage.date)}` : 'No records'}
            icon="chart.line.uptrend.xyaxis"
          />
        </View>

        <LogSection
          title="Recent Mileage"
          logs={vehicle.mileage_logs?.slice(0, 3).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []}
          icon="speedometer"
          onAddPress={vehicle.is_own_vehicle ?
            () => router.push(`/logs/mileage/add?vehicleId=${vehicle.id}` as any) :
            () => router.push(`/logs/mileage/add?vehicleId=${vehicle.id}` as any)
          }
          showAddButton={true} // Both owners and members can add logs for shared vehicles
          isReadOnly={!vehicle.is_own_vehicle}
        />

        <LogSection
          title="Recent Fuel"
          logs={vehicle.fuel_logs?.slice(0, 3).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []}
          icon="fuelpump"
          onAddPress={vehicle.is_own_vehicle ?
            () => router.push(`/logs/fuel/add?vehicleId=${vehicle.id}` as any) :
            () => router.push(`/logs/fuel/add?vehicleId=${vehicle.id}` as any)
          }
          showAddButton={true} // Both owners and members can add logs for shared vehicles
          isReadOnly={!vehicle.is_own_vehicle}
        />

        <LogSection
          title="Recent Service"
          logs={vehicle.service_logs?.slice(0, 3).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []}
          icon="wrench"
          onAddPress={vehicle.is_own_vehicle ?
            () => router.push(`/logs/service/add?vehicleId=${vehicle.id}` as any) :
            () => router.push(`/logs/service/add?vehicleId=${vehicle.id}` as any)
          }
          showAddButton={true} // Both owners and members can add logs for shared vehicles
          isReadOnly={!vehicle.is_own_vehicle}
        />
      </ScrollView>
    </SafeAreaView>
  );
}