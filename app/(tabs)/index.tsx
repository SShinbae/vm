import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { VehicleService } from '@/lib/services/vehicleService';
import { Vehicle } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WebLayout } from '@/components/layout/WebLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const fetchData = useCallback(async () => {
    const { data, error } = await VehicleService.getVehicles();
    if (!error && data) {
      setVehicles(data);
    }
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const QuickActionCard = ({ title, icon, onPress, color }: any) => (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: color + '30' }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIcon}>
          <IconSymbol name="car.fill" size={20} color="white" />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
        </View>
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    greeting: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.icon,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    quickActionCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      alignItems: 'center',
      gap: 12,
      width: '48%',
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
    vehicleCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
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
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.icon,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
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
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    viewAllText: {
      fontSize: 16,
      color: colors.tint,
      fontWeight: '500',
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const quickActions = [
    {
      title: "Add Vehicle",
      icon: "plus",
      color: colors.tint,
      onPress: () => router.push('/vehicles/add' as any)
    },
    {
      title: "Log Mileage",
      icon: "speedometer",
      color: "#2196F3",
      onPress: () => router.push('/logs/mileage/add' as any)
    },
    {
      title: "Log Fuel",
      icon: "fuelpump",
      color: "#4CAF50",
      onPress: () => router.push('/logs/fuel/add' as any)
    },
    {
      title: "Log Service",
      icon: "wrench",
      color: "#FF9800",
      onPress: () => router.push('/logs/service/add' as any)
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <WebLayout>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome{user?.profile?.full_name ? `, ${user.profile.full_name.split(' ')[0]}` : ''}!
          </Text>
          <Text style={styles.subtitle}>Manage your vehicles and track your data</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  icon={action.icon}
                  color={action.color}
                  onPress={action.onPress}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.viewAllButton}>
              <Text style={styles.sectionTitle}>My Vehicles</Text>
              {vehicles.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/vehicles')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {vehicles.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <IconSymbol name="car" size={24} color={colors.icon} />
                </View>
                <Text style={styles.emptyTitle}>No vehicles yet</Text>
                <Text style={styles.emptyDescription}>
                  Add your first vehicle to start tracking mileage, fuel, and maintenance
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/vehicles/add' as any)}
                >
                  <IconSymbol name="plus" size={16} color="white" />
                  <Text style={styles.emptyButtonText}>Add Vehicle</Text>
                </TouchableOpacity>
              </View>
            ) : layout.isDesktop ? (
              <ResponsiveGrid minItemWidth={300} spacing={16}>
                {vehicles.slice(0, 3).map(vehicle => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </ResponsiveGrid>
            ) : (
              vehicles.slice(0, 3).map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))
            )}
          </View>
        </ScrollView>
      </WebLayout>
    </SafeAreaView>
  );
}
