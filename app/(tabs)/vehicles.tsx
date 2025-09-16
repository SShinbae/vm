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
import { router } from 'expo-router';
import { VehicleService } from '@/lib/services/vehicleService';
import { Vehicle } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await VehicleService.getVehicles();

    if (error) {
      Alert.alert('Error', 'Failed to load vehicles');
    } else if (data) {
      setVehicles(data);
    }

    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  }, [fetchVehicles]);

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone.`,
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
              setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
              Alert.alert('Success', 'Vehicle deleted successfully');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIcon}>
          <IconSymbol name="car.fill" size={24} color="white" />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteVehicle(vehicle)}
        >
          <IconSymbol name="trash" size={18} color="#ff4444" />
        </TouchableOpacity>
      </View>

      {vehicle.vin && (
        <View style={styles.vehicleDetails}>
          <Text style={styles.detailLabel}>VIN: {vehicle.vin}</Text>
        </View>
      )}

      <View style={styles.vehicleFooter}>
        <Text style={styles.addedDate}>
          Added {new Date(vehicle.created_at).toLocaleDateString()}
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
    vehicleName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: '500',
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

      {vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <IconSymbol name="car" size={32} color={colors.icon} />
          </View>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptyDescription}>
            Add your first vehicle to start tracking mileage, fuel consumption, and maintenance.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/vehicles/add' as any)}
          >
            <IconSymbol name="plus" size={16} color="white" />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.vehiclesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}