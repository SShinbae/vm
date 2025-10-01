import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { WebLayout } from '@/components/layout/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MetricCard } from '@/components/ui/MetricCard';
import { TrendCard } from '@/components/ui/TrendCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FuelLogService, ServiceLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { AnalyticsService } from '@/lib/services/analyticsService';
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
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await AnalyticsService.getAnalytics('last6months');
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(null);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const { data, error } = await VehicleService.getVehicles();
    if (!error && data) {
      setVehicles(data);
    }
    await loadAnalytics();
    setLoading(false);
  }, [loadAnalytics]);

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

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => {
    const [imageError, setImageError] = React.useState(false);

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
      >
        <View style={styles.vehicleHeader}>
          {vehicle.main_image_url && !imageError ? (
            <Image
              source={{ uri: vehicle.main_image_url }}
              style={styles.vehicleImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onError={(error) => {
                console.error('Dashboard - Image load error for vehicle:', vehicle.id, error);
                console.log('Dashboard - Failed URL:', vehicle.main_image_url);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Dashboard - Image loaded successfully for vehicle:', vehicle.id);
              }}
            />
          ) : (
            <View style={styles.vehicleIcon}>
              <IconSymbol name="car.fill" size={20} color={colors.tint} />
            </View>
          )}
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
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    greeting: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      padding: 24,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    analyticsSection: {
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    metricsGrid: {
      gap: 16,
    },
    quickActionsFixed: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
    },
    overviewLayout: {
      gap: 16,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    metricCardHalf: {
      flex: 1,
    },
    quickActionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      width: '47%',
    },
    quickActionIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    vehicleCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vehicleIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    vehicleImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
      backgroundColor: colors.backgroundSecondary,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      maxWidth: 300,
    },
    emptyButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
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
      marginTop: 8,
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
      icon: "plus.circle.fill",
      color: colors.tint,
      onPress: () => router.push('/vehicles/add' as any)
    },
    {
      title: "Log Mileage",
      icon: "speedometer",
      color: colors.chart.mileage,
      onPress: () => router.push('/logs/mileage/add' as any)
    },
    {
      title: "Log Fuel",
      icon: "fuelpump.fill",
      color: colors.chart.fuel,
      onPress: () => router.push('/logs/fuel/add' as any)
    },
    {
      title: "Log Service",
      icon: "wrench.fill",
      color: colors.chart.service,
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
          {/* Analytics Overview */}
          {analyticsData && analyticsData.totalExpenses > 0 && (
            <View style={[styles.section, styles.analyticsSection]}>
              <Text style={styles.sectionTitle}>Overview</Text>

              <View style={styles.overviewLayout}>
                {/* Total Expenses - Full Width Row */}
                <TrendCard
                  title="Total Expenses"
                  value={`RM${analyticsData.totalExpenses.toFixed(2)}`}
                  trend={(analyticsData.fuelTrend + analyticsData.serviceTrend) / 2}
                  subtitle="Last 6 months"
                  icon="dollarsign.circle.fill"
                  gradientColors={colors.gradients.primary}
                  onPress={() => router.push('/analytics')}
                />

                {/* Fuel and Service - Two Column Row */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCardHalf}>
                    <MetricCard
                      title="Fuel Expenses"
                      value={`RM${analyticsData.expenseBreakdown.find((e: any) => e.category === 'Fuel')?.amount.toFixed(2) || '0.00'}`}
                      trend={analyticsData.fuelTrend}
                      icon="fuelpump.fill"
                      color={colors.chart.fuel}
                      size={layout.isMobile ? "small" : "medium"}
                    />
                  </View>
                  <View style={styles.metricCardHalf}>
                    <MetricCard
                      title="Service Expenses"
                      value={`RM${analyticsData.expenseBreakdown.find((e: any) => e.category === 'Service')?.amount.toFixed(2) || '0.00'}`}
                      trend={analyticsData.serviceTrend}
                      icon="wrench.fill"
                      color={colors.chart.service}
                      size={layout.isMobile ? "small" : "medium"}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsFixed}>
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
