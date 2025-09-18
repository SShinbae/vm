// import { VehicleService } from '@/lib/services/vehicleService';
// import { VehicleServiceV2 } from '@/lib/services/vehicleServiceV2';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VehicleServiceV2 } from '../../lib/services/vehicleServiceV2';

import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { WebLayout } from '@/components/layout/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { formatDateWithPrefix } from '@/lib/utils/dateUtils';
import { VehicleWithDetails } from '@/types/database-v2';

export default function VehiclesScreen() {
  const [ownVehicles, setOwnVehicles] = useState<VehicleWithDetails[]>([]);
  const [sharedVehicles, setSharedVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await VehicleServiceV2.getVehiclesSeparated();

    if (error) {
      Alert.alert('Error', 'Failed to load vehicles');
      console.error('Failed to fetch vehicles:', error);
    } else if (data) {
      setOwnVehicles(data.ownVehicles);
      setSharedVehicles(data.sharedVehicles);
      console.log('🚗 Vehicles loaded:', {
        ownCount: data.ownVehicles.length,
        sharedCount: data.sharedVehicles.length
      });
    }

    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  }, [fetchVehicles]);

  const handleDeleteVehicle = (vehicle: VehicleWithDetails) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone.`,
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
              setOwnVehicles(prev => prev.filter(v => v.id !== vehicle.id));
              Alert.alert('Success', 'Vehicle deleted successfully');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  const VehicleCard = ({ vehicle }: { vehicle: VehicleWithDetails }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
    >
      <View style={styles.vehicleHeader}>
        <View style={[styles.vehicleIcon, !vehicle.is_own_vehicle && styles.groupVehicleIcon]}>
          <IconSymbol name={!vehicle.is_own_vehicle ? "person.3.fill" : "car.fill"} size={24} color="white" />
        </View>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleNameRow}>
            <Text style={styles.vehicleName}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            {vehicle.is_own_vehicle && vehicle.shared_groups && vehicle.shared_groups.length > 0 && (
              <View style={styles.sharedBadge}>
                <IconSymbol name="person.3.fill" size={12} color="white" />
              </View>
            )}
          </View>
          <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
          {!vehicle.is_own_vehicle && vehicle.owner_profile && (
            <Text style={styles.ownerInfo}>
              Owned by {vehicle.owner_profile.full_name || vehicle.owner_profile.email}
            </Text>
          )}
          {vehicle.is_own_vehicle && vehicle.shared_groups && vehicle.shared_groups.length > 0 && (
            <Text style={styles.sharingStatus}>
              Shared with {vehicle.shared_groups.length} group{vehicle.shared_groups.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {vehicle.is_own_vehicle && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteVehicle(vehicle)}
          >
            <IconSymbol name="trash" size={18} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>

      {vehicle.vin && (
        <View style={styles.vehicleDetails}>
          <Text style={styles.detailLabel}>VIN: {vehicle.vin}</Text>
        </View>
      )}

      <View style={styles.vehicleFooter}>
        <Text style={styles.addedDate}>
          {vehicle.created_at ? formatDateWithPrefix(vehicle.created_at, 'Added') : 'Added recently'}
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.icon} />
      </View>
    </TouchableOpacity>
  );

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
    content: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
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
      textAlign: 'center',
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
    vehiclesList: {
      padding: 20,
    },
    vehicleCard: {
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
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    vehicleIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    vehicleName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    sharedBadge: {
      backgroundColor: '#4CAF50',
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: '500',
    },
    groupVehicleIcon: {
      backgroundColor: '#4CAF50', // Green color for group vehicles
    },
    ownerInfo: {
      fontSize: 12,
      color: '#4CAF50',
      fontStyle: 'italic',
      marginTop: 2,
    },
    sharingStatus: {
      fontSize: 12,
      color: '#4CAF50',
      fontWeight: '500',
      marginTop: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '10',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.icon,
      marginTop: 2,
    },
    sectionCount: {
      backgroundColor: colors.tint,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
    },
    sectionCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    sectionContent: {
      padding: 20,
    },
    emptySection: {
      paddingVertical: 40,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    emptySectionIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.icon + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptySectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySectionDescription: {
      fontSize: 14,
      color: colors.icon,
      textAlign: 'center',
      lineHeight: 20,
    },
    deleteButton: {
      padding: 8,
    },
    vehicleDetails: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.icon,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vehicleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.icon + '10',
    },
    addedDate: {
      fontSize: 12,
      color: colors.icon,
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
          <Text style={styles.title}>Vehicles</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebLayout>
        <View style={styles.header}>
          <Text style={styles.title}>Vehicles</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/vehicles/add' as any)}
          >
            <IconSymbol name="plus" size={16} color="white" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* My Vehicles Section */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Vehicles</Text>
              <Text style={styles.sectionSubtitle}>Vehicles you own</Text>
            </View>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{ownVehicles.length}</Text>
            </View>
          </View>

          {ownVehicles.length === 0 ? (
            <View style={styles.emptySection}>
              <View style={styles.emptySectionIcon}>
                <IconSymbol name="car" size={24} color={colors.icon} />
              </View>
              <Text style={styles.emptySectionTitle}>No vehicles yet</Text>
              <Text style={styles.emptySectionDescription}>
                Add your first vehicle to start tracking mileage, fuel consumption, and maintenance.
              </Text>
            </View>
          ) : (
            <View style={styles.sectionContent}>
              {layout.isDesktop ? (
                <ResponsiveGrid minItemWidth={350} spacing={16}>
                  {ownVehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </ResponsiveGrid>
              ) : (
                ownVehicles.map(vehicle => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))
              )}
            </View>
          )}

          {/* Shared Vehicles Section */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Shared Vehicles</Text>
              <Text style={styles.sectionSubtitle}>Vehicles shared by group members</Text>
            </View>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{sharedVehicles.length}</Text>
            </View>
          </View>

          {sharedVehicles.length === 0 ? (
            <View style={styles.emptySection}>
              <View style={styles.emptySectionIcon}>
                <IconSymbol name="person.3.fill" size={24} color={colors.icon} />
              </View>
              <Text style={styles.emptySectionTitle}>No shared vehicles</Text>
              <Text style={styles.emptySectionDescription}>
                Join a group and ask members to share their vehicles with you, or ask group owners to enable vehicle sharing.
              </Text>
            </View>
          ) : (
            <View style={styles.sectionContent}>
              {layout.isDesktop ? (
                <ResponsiveGrid minItemWidth={350} spacing={16}>
                  {sharedVehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </ResponsiveGrid>
              ) : (
                sharedVehicles.map(vehicle => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))
              )}
            </View>
          )}
        </ScrollView>
      </WebLayout>
    </SafeAreaView>
  );
}