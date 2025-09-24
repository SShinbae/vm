import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { FuelLogService, MileageLogService, ServiceLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VehicleAnalytics {
  vehicleId: string;
  vehicleName: string;
  totalFuelCost: number;
  totalServiceCost: number;
  totalMileage: number;
  fuelEfficiency: number;
  avgCostPerMile: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleAnalytics[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryBreakdown[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const getInitialDateRange = (): DateRange => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    return {
      startDate: startOfYear.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      label: 'This Year',
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange());

  const calculateAnalytics = useCallback(async () => {
    try {
      const [vehiclesResponse, fuelResponse, serviceResponse, mileageResponse] = await Promise.all([
        VehicleService.getVehicles(),
        FuelLogService.getFuelLogs(),
        ServiceLogService.getServiceLogs(),
        MileageLogService.getMileageLogs(),
      ]);

      const vehicles = vehiclesResponse.data || [];
      const fuelLogs = fuelResponse.data || [];
      const serviceLogs = serviceResponse.data || [];
      const mileageLogs = mileageResponse.data || [];

      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      const filteredFuel = fuelLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });

      const filteredService = serviceLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });

      const filteredMileage = mileageLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });

      const vehicleStats: VehicleAnalytics[] = vehicles.map(vehicle => {
        const vFuel = filteredFuel.filter(log => log.vehicle_id === vehicle.id);
        const vService = filteredService.filter(log => log.vehicle_id === vehicle.id);
        const vMileage = filteredMileage.filter(log => log.vehicle_id === vehicle.id);

        const totalFuelCost = vFuel.reduce((sum, log) => sum + (log.cost || 0), 0);
        const totalServiceCost = vService.reduce((sum, log) => sum + (log.cost || 0), 0);
        const totalMileage = vMileage.reduce((sum, log) => sum + (log.mileage || 0), 0);
        const totalFuelAmount = vFuel.reduce((sum, log) => sum + (log.amount || 0), 0);

        return {
          vehicleId: vehicle.id!,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          totalFuelCost,
          totalServiceCost,
          totalMileage,
          fuelEfficiency: totalFuelAmount > 0 ? totalMileage / totalFuelAmount : 0,
          avgCostPerMile: totalMileage > 0 ? (totalFuelCost + totalServiceCost) / totalMileage : 0,
        };
      });

      setVehicleAnalytics(vehicleStats);

      const categoryMap = new Map<string, number>();
      filteredService.forEach(log => {
        const category = log.service_type || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (log.cost || 0));
      });

      const totalServiceCost = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
      const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

      const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([category, amount], index) => ({
          category,
          amount,
          percentage: totalServiceCost > 0 ? (amount / totalServiceCost) * 100 : 0,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      setServiceCategories(categories);

      const monthlyData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthDate.toLocaleDateString('en', { month: 'short' });

        const monthFuel = fuelLogs
          .filter(log => {
            const logDate = new Date(log.date);
            return logDate >= monthDate && logDate <= monthEnd;
          })
          .reduce((sum, log) => sum + (log.cost || 0), 0);

        const monthService = serviceLogs
          .filter(log => {
            const logDate = new Date(log.date);
            return logDate >= monthDate && logDate <= monthEnd;
          })
          .reduce((sum, log) => sum + (log.cost || 0), 0);

        monthlyData.push({
          month: monthName,
          fuel: monthFuel,
          service: monthService,
          total: monthFuel + monthService,
        });
      }

      setMonthlyComparison(monthlyData);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating analytics:', error);
      setLoading(false);
    }
  }, [dateRange]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await calculateAnalytics();
    setRefreshing(false);
  }, [calculateAnalytics]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  const StatCard = ({ title, value, subtitle, icon, iconColor }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
          <IconSymbol name={icon} size={24} color={iconColor} />
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    header: {
      flexDirection: layout.isDesktop ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: layout.isDesktop ? 'center' : 'flex-start',
      paddingHorizontal: layout.isMobile ? 16 : 24,
      paddingVertical: layout.isMobile ? 16 : 24,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      gap: 12,
    },
    title: {
      fontSize: layout.isMobile ? 24 : 30,
      fontWeight: '600',
      color: colors.text,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      paddingHorizontal: layout.isMobile ? 16 : 24,
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: layout.isDesktop ? 'row' : 'column',
      gap: layout.isMobile ? 12 : 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: layout.isMobile ? 16 : 20,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    statTitle: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 8,
    },
    statValue: {
      fontSize: layout.isMobile ? 20 : 24,
      fontWeight: '700',
      color: '#111827',
    },
    statSubtitle: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 4,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: layout.isMobile ? 16 : 20,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    vehicleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    vehicleName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    vehicleStats: {
      flexDirection: 'row',
      gap: 16,
    },
    vehicleStat: {
      alignItems: 'flex-end',
    },
    vehicleStatLabel: {
      fontSize: 12,
      color: '#6B7280',
    },
    vehicleStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    categoryName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    categoryAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginRight: 12,
    },
    categoryPercentage: {
      fontSize: 12,
      color: '#6B7280',
      width: 50,
      textAlign: 'right',
    },
    chartRow: {
      flexDirection: layout.isDesktop ? 'row' : 'column',
      gap: layout.isMobile ? 12 : 16,
    },
    chartCard: {
      flex: 1,
    },
    monthlyRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    monthlyItem: {
      flex: 1,
      alignItems: 'center',
    },
    monthlyBars: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: 8,
    },
    monthlyBar: {
      width: 8,
      borderRadius: 4,
      minHeight: 4,
    },
    monthlyLabel: {
      fontSize: 12,
      color: '#6B7280',
    },
    monthlyValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  const totalFuel = vehicleAnalytics.reduce((sum, v) => sum + v.totalFuelCost, 0);
  const totalService = vehicleAnalytics.reduce((sum, v) => sum + v.totalServiceCost, 0);
  const totalMileage = vehicleAnalytics.reduce((sum, v) => sum + v.totalMileage, 0);
  const avgEfficiency = vehicleAnalytics.reduce((sum, v) => sum + v.fuelEfficiency, 0) / Math.max(vehicleAnalytics.length, 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <DateRangeFilter selectedRange={dateRange} onRangeChange={setDateRange} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Fuel Cost"
              value={`RM${totalFuel.toFixed(2)}`}
              subtitle={`${dateRange.label}`}
              icon="fuelpump"
              iconColor="#F59E0B"
            />
            <StatCard
              title="Total Service Cost"
              value={`RM${totalService.toFixed(2)}`}
              subtitle={`${dateRange.label}`}
              icon="wrench"
              iconColor="#3B82F6"
            />
            <StatCard
              title="Total Mileage"
              value={`${totalMileage.toFixed(0)} km`}
              subtitle="All vehicles"
              icon="gauge"
              iconColor="#10B981"
            />
            <StatCard
              title="Avg Efficiency"
              value={`${avgEfficiency.toFixed(1)} km/L`}
              subtitle="Across fleet"
              icon="chart.line.uptrend.xyaxis"
              iconColor="#8B5CF6"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Performance</Text>
          <View style={styles.card}>
            {vehicleAnalytics.map((vehicle, index) => (
              <View key={vehicle.vehicleId} style={styles.vehicleRow}>
                <Text style={styles.vehicleName}>{vehicle.vehicleName}</Text>
                <View style={styles.vehicleStats}>
                  {!layout.isMobile && (
                    <View style={styles.vehicleStat}>
                      <Text style={styles.vehicleStatLabel}>Efficiency</Text>
                      <Text style={styles.vehicleStatValue}>{vehicle.fuelEfficiency.toFixed(1)} km/L</Text>
                    </View>
                  )}
                  <View style={styles.vehicleStat}>
                    <Text style={styles.vehicleStatLabel}>Cost/km</Text>
                    <Text style={styles.vehicleStatValue}>RM{vehicle.avgCostPerMile.toFixed(2)}</Text>
                  </View>
                  <View style={styles.vehicleStat}>
                    <Text style={styles.vehicleStatLabel}>Total</Text>
                    <Text style={styles.vehicleStatValue}>RM{(vehicle.totalFuelCost + vehicle.totalServiceCost).toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Cost Breakdown</Text>
          <View style={styles.card}>
            {serviceCategories.length > 0 ? (
              serviceCategories.map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryAmount}>RM{category.amount.toFixed(0)}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>
                No service logs found for selected period
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Comparison</Text>
          <View style={[styles.card, styles.chartCard]}>
            <View style={styles.monthlyRow}>
              {monthlyComparison.map((item, index) => {
                const maxTotal = Math.max(...monthlyComparison.map(m => m.total), 1);
                const fuelHeight = (item.fuel / maxTotal) * 100;
                const serviceHeight = (item.service / maxTotal) * 100;

                return (
                  <View key={index} style={styles.monthlyItem}>
                    <View style={styles.monthlyBars}>
                      <View
                        style={[
                          styles.monthlyBar,
                          { height: Math.max(fuelHeight, 4), backgroundColor: '#F59E0B' },
                        ]}
                      />
                      <View
                        style={[
                          styles.monthlyBar,
                          { height: Math.max(serviceHeight, 4), backgroundColor: '#3B82F6' },
                        ]}
                      />
                    </View>
                    <Text style={styles.monthlyLabel}>{item.month}</Text>
                    <Text style={styles.monthlyValue}>RM{item.total.toFixed(0)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}