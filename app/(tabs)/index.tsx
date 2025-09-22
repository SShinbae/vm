import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { WebLayout } from '@/components/layout/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FuelLogService, ServiceLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { Vehicle } from '@/types';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Analytics {
  totalExpenses: number;
  fuelCosts: number;
  serviceCosts: number;
  avgCostPerMile: number;
  fuelTrend: number;
  serviceTrend: number;
  costPerMileTrend: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const calculateAnalytics = useCallback(async () => {
    try {
      const [fuelResponse, serviceResponse] = await Promise.all([
        FuelLogService.getFuelLogs(),
        ServiceLogService.getServiceLogs()
      ]);

      const fuelLogs = fuelResponse.data || [];
      const serviceLogs = serviceResponse.data || [];

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      // Current month costs
      const thisMonthFuel = fuelLogs
        .filter(log => new Date(log.date) >= thisMonth)
        .reduce((sum, log) => sum + (log.cost || 0), 0);

      const thisMonthService = serviceLogs
        .filter(log => new Date(log.date) >= thisMonth)
        .reduce((sum, log) => sum + (log.cost || 0), 0);

      // Last month costs for comparison
      const lastMonthFuel = fuelLogs
        .filter(log => new Date(log.date) >= lastMonth && new Date(log.date) < thisMonth)
        .reduce((sum, log) => sum + (log.cost || 0), 0);

      const lastMonthService = serviceLogs
        .filter(log => new Date(log.date) >= lastMonth && new Date(log.date) < thisMonth)
        .reduce((sum, log) => sum + (log.cost || 0), 0);

      // Calculate trends (percentage change)
      const fuelTrend = lastMonthFuel > 0 ? ((thisMonthFuel - lastMonthFuel) / lastMonthFuel) * 100 : 0;
      const serviceTrend = lastMonthService > 0 ? ((thisMonthService - lastMonthService) / lastMonthService) * 100 : 0;

      // Calculate average cost per mile (rough estimate)
      const totalCosts = thisMonthFuel + thisMonthService;
      const avgCostPerMile = totalCosts > 0 ? totalCosts / Math.max(1, fuelLogs.length * 50) : 0; // Rough estimate
      const lastMonthAvg = (lastMonthFuel + lastMonthService) / Math.max(1, fuelLogs.filter(log => new Date(log.date) >= lastMonth && new Date(log.date) < thisMonth).length * 50);
      const costPerMileTrend = lastMonthAvg > 0 ? ((avgCostPerMile - lastMonthAvg) / lastMonthAvg) * 100 : 0;

      setAnalytics({
        totalExpenses: thisMonthFuel + thisMonthService,
        fuelCosts: thisMonthFuel,
        serviceCosts: thisMonthService,
        avgCostPerMile,
        fuelTrend,
        serviceTrend,
        costPerMileTrend
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
      setAnalytics({
        totalExpenses: 0,
        fuelCosts: 0,
        serviceCosts: 0,
        avgCostPerMile: 0,
        fuelTrend: 0,
        serviceTrend: 0,
        costPerMileTrend: 0
      });
    }
  }, []);

  const fetchData = useCallback(async () => {
    const { data, error } = await VehicleService.getVehicles();
    if (!error && data) {
      setVehicles(data);
    }
    await calculateAnalytics();
    setLoading(false);
  }, [calculateAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const MetricCard = ({ title, value, trend, unit = '' }: { title: string, value: number, trend: number, unit?: string }) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{unit}{value.toFixed(unit === 'RM' ? 2 : 0)}</Text>
        <Text style={[styles.metricTrend, { color: trend >= 0 ? colors.facebook.success : colors.facebook.error }]}>
          {trend >= 0 ? '📈' : '📉'} {Math.abs(trend).toFixed(1)}%
        </Text>
      </View>
      <Text style={styles.metricSubtext}>compared to last month</Text>
    </View>
  );

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
      backgroundColor: colors.facebook.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    breadcrumb: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    breadcrumbText: {
      fontSize: 14,
      color: colors.icon,
    },
    breadcrumbActive: {
      color: colors.text,
      fontWeight: '500',
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.icon,
    },
    analyticsSection: {
      padding: 24,
      backgroundColor: colors.background,
      marginBottom: 24,
    },
    analyticsTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    totalExpenses: {
      fontSize: 36,
      fontWeight: '700',
      color: '#b794f6',
      marginBottom: 32,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    },
    metricCard: {
      flex: 1,
      minWidth: 120,
    },
    metricTitle: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 8,
    },
    metricValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    metricTrend: {
      fontSize: 14,
    },
    metricSubtext: {
      fontSize: 12,
      color: colors.icon,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      padding: 24,
      backgroundColor: colors.background,
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
      borderColor: colors.border,
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
      borderColor: colors.border,
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
          {analytics && (
            <View style={styles.analyticsSection}>
              <Text style={styles.analyticsTitle}>Your total vehicle expenses</Text>
              <Text style={styles.totalExpenses}>RM{analytics.totalExpenses.toFixed(2)}</Text>

              {layout.isDesktop ? (
                <View style={styles.metricsRow}>
                  <MetricCard
                    title="Fuel Costs"
                    value={analytics.fuelCosts}
                    trend={analytics.fuelTrend}
                    unit="RM"
                  />
                  <MetricCard
                    title="Service Costs"
                    value={analytics.serviceCosts}
                    trend={analytics.serviceTrend}
                    unit="RM"
                  />
                  <MetricCard
                    title="Avg. Cost per Mile"
                    value={analytics.avgCostPerMile}
                    trend={analytics.costPerMileTrend}
                    unit="RM"
                  />
                </View>
              ) : (
                <View>
                  <View style={[styles.metricsRow, { marginBottom: 16 }]}>
                    <MetricCard
                      title="Fuel Costs"
                      value={analytics.fuelCosts}
                      trend={analytics.fuelTrend}
                      unit="RM"
                    />
                    <MetricCard
                      title="Service Costs"
                      value={analytics.serviceCosts}
                      trend={analytics.serviceTrend}
                      unit="RM"
                    />
                  </View>
                  <MetricCard
                    title="Avg. Cost per Mile"
                    value={analytics.avgCostPerMile}
                    trend={analytics.costPerMileTrend}
                    unit="RM"
                  />
                </View>
              )}
            </View>
          )}

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
