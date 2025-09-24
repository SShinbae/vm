import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { WebLayout } from '@/components/layout/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FuelLogService, MileageLogService, ServiceLogService } from '@/lib/services/loggingService';
import { VehicleService } from '@/lib/services/vehicleService';
import { Vehicle, FuelLog, ServiceLog, MileageLog } from '@/types';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  vehiclesTrend: number;
  monthlyData: Array<{
    month: string;
    fuel: number;
    service: number;
  }>;
  weeklyData: Array<{
    day: string;
    value: number;
    amount: number;
    highlighted: boolean;
  }>;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const getInitialDateRange = (): DateRange => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      label: 'This Month',
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange());
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const calculateAnalytics = useCallback(async () => {
    try {
      const [fuelResponse, serviceResponse, mileageResponse] = await Promise.all([
        FuelLogService.getFuelLogs(),
        ServiceLogService.getServiceLogs(),
        MileageLogService.getMileageLogs()
      ]);

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

      const currentFuel = filteredFuel.reduce((sum, log) => sum + (log.cost || 0), 0);
      const currentService = filteredService.reduce((sum, log) => sum + (log.cost || 0), 0);

      const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(startDate);
      previousStart.setDate(previousStart.getDate() - rangeDays);
      const previousEnd = new Date(startDate);
      previousEnd.setDate(previousEnd.getDate() - 1);

      const previousFuel = fuelLogs
        .filter(log => {
          const logDate = new Date(log.date);
          return logDate >= previousStart && logDate <= previousEnd;
        })
        .reduce((sum, log) => sum + (log.cost || 0), 0);

      const previousService = serviceLogs
        .filter(log => {
          const logDate = new Date(log.date);
          return logDate >= previousStart && logDate <= previousEnd;
        })
        .reduce((sum, log) => sum + (log.cost || 0), 0);

      const fuelTrend = previousFuel > 0 ? ((currentFuel - previousFuel) / previousFuel) * 100 : 0;
      const serviceTrend = previousService > 0 ? ((currentService - previousService) / previousService) * 100 : 0;

      const totalMileage = mileageLogs
        .filter(log => {
          const logDate = new Date(log.date);
          return logDate >= startDate && logDate <= endDate;
        })
        .reduce((sum, log) => sum + (log.mileage || 0), 0);

      const avgCostPerMile = totalMileage > 0 ? (currentFuel + currentService) / totalMileage : 0;

      const previousMileage = mileageLogs
        .filter(log => {
          const logDate = new Date(log.date);
          return logDate >= previousStart && logDate <= previousEnd;
        })
        .reduce((sum, log) => sum + (log.mileage || 0), 0);

      const previousAvgCostPerMile = previousMileage > 0 ? (previousFuel + previousService) / previousMileage : 0;
      const costPerMileTrend = previousAvgCostPerMile > 0 ? ((avgCostPerMile - previousAvgCostPerMile) / previousAvgCostPerMile) * 100 : 0;

      const monthlyData = [];
      const now = new Date();
      for (let i = 4; i >= 0; i--) {
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

        monthlyData.push({ month: monthName, fuel: monthFuel, service: monthService });
      }

      const weeklyData = [];
      const daysInRange = Math.min(rangeDays, 7);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = daysInRange - 1; i >= 0; i--) {
        const dayDate = new Date(endDate);
        dayDate.setDate(dayDate.getDate() - i);
        const dayName = dayNames[dayDate.getDay()];

        const dayTotal = [...filteredFuel, ...filteredService]
          .filter(log => new Date(log.date).toDateString() === dayDate.toDateString())
          .reduce((sum, log) => sum + (log.cost || 0), 0);

        weeklyData.push({
          day: dayName,
          value: Math.min((dayTotal / 10), 100),
          amount: dayTotal,
          highlighted: dayDate.toDateString() === now.toDateString()
        });
      }

      setAnalytics({
        totalExpenses: currentFuel + currentService,
        fuelCosts: currentFuel,
        serviceCosts: currentService,
        avgCostPerMile,
        fuelTrend,
        serviceTrend,
        costPerMileTrend,
        vehiclesTrend: vehicles.length > 0 ? 12.5 : 0,
        monthlyData,
        weeklyData
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
        costPerMileTrend: 0,
        vehiclesTrend: 0,
        monthlyData: [],
        weeklyData: []
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

  useEffect(() => {
    calculateAnalytics();
  }, [dateRange]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ModernHeader = () => (
    <View style={styles.modernHeader}>
      {/* Left: Logo and App Name */}
      <View style={styles.headerLeft}>
        <View style={styles.appLogo}>
          <IconSymbol name="car.fill" size={16} color="white" />
        </View>
        <Text style={styles.appName}>VehicleTracker</Text>
      </View>

      {/* Center: Search Bar (hidden on mobile) */}
      {layout.isDesktop && (
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.icon}
          />
          <View style={styles.searchShortcuts}>
            <Text style={styles.shortcutKey}>⌘</Text>
            <Text style={styles.shortcutKey}>K</Text>
          </View>
        </View>
      )}

      {/* Right: User Profile */}
      <View style={styles.headerRight}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </Text>
        </View>
        {layout.isDesktop && (
          <>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.profile?.full_name || 'User'}
              </Text>
              <Text style={styles.userRole}>Admin</Text>
            </View>
            <IconSymbol name="chevron.down" size={16} color={colors.icon} />
          </>
        )}
      </View>
    </View>
  );

  const StatCard = ({ title, value, change, changeType, lastMonth, icon }: {
    title: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down';
    lastMonth: string;
    icon: React.ReactNode;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statFooter}>
        {change && (
          <Text style={[styles.statChange, { color: changeType === 'up' ? '#10B981' : '#EF4444' }]}>
            {changeType === 'up' ? '↗' : '↘'} {change}
          </Text>
        )}
        <Text style={styles.statLastMonth}>Last month: {lastMonth}</Text>
      </View>
    </View>
  );

  const BarChart = () => {
    if (!analytics?.weeklyData) return null;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Expense Analytics</Text>
        </View>

        <View style={styles.chartContent}>
          <View style={styles.yAxisLabels}>
            {['30k', '25k', '20k', '15k', '10k', '5k', '0k'].map((label, index) => (
              <Text key={index} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>

          <View style={styles.barsContainer}>
            {analytics.weeklyData.map((item, index) => (
              <View key={index} style={styles.barItem}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${item.value}%`,
                        backgroundColor: item.highlighted ? '#F59E0B' : '#FCD34D'
                      }
                    ]}
                  >
                    {item.highlighted && item.amount > 0 && (
                      <View style={styles.barTooltip}>
                        <Text style={styles.tooltipText}>RM{item.amount.toFixed(0)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const ProfitLossChart = () => {
    if (!analytics?.monthlyData) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Total Expenses</Text>
        <Text style={styles.chartSubtitle}>View your expenses in a certain period of time</Text>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Fuel</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1F2937' }]} />
            <Text style={styles.legendText}>Service</Text>
          </View>
        </View>

        <View style={styles.chartContent}>
          <View style={styles.yAxisLabels}>
            {['50k', '40k', '30k', '20k', '10k', '0k'].map((label, index) => (
              <Text key={index} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>

          <View style={styles.barsContainer}>
            {analytics.monthlyData.map((item, index) => (
              <View key={index} style={styles.barItem}>
                <View style={styles.stackedBarWrapper}>
                  <View
                    style={[styles.stackedBar, {
                      height: Math.max(item.fuel / 10, 2),
                      backgroundColor: '#F59E0B'
                    }]}
                  />
                  <View
                    style={[styles.stackedBar, {
                      height: Math.max(item.service / 10, 2),
                      backgroundColor: '#1F2937'
                    }]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const QuickActionCard = ({ title, icon, onPress, color }: any) => (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: color + '30' }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const VehicleTableRow = ({ vehicle, index }: { vehicle: Vehicle; index: number }) => {
    const vehicleTotal = [...(analytics?.weeklyData || [])].reduce((sum, item) => sum + item.amount, 0) / Math.max(vehicles.length, 1);

    return (
      <TouchableOpacity
        style={styles.tableRow}
        onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
      >
        {!layout.isMobile && (
          <View style={styles.tableCell}>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.tableCellText}>#{vehicle.id?.slice(-6) || '000000'}</Text>
            </View>
          </View>
        )}
        {layout.isDesktop && (
          <Text style={[styles.tableCellText, styles.tableCell]}>
            {new Date(vehicle.created_at || '').toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        )}
        <Text style={[styles.tableCellText, styles.tableCell, { flex: layout.isMobile ? 2 : 1 }]}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
        <Text style={[styles.tableCellText, styles.tableCell]}>{vehicle.license_plate}</Text>
        <View style={[styles.tableCell, styles.statusCell]}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        {layout.isDesktop && (
          <Text style={[styles.tableCellText, styles.tableCell]}>Low</Text>
        )}
        <Text style={[styles.tableCellText, styles.tableCell, styles.boldText]}>
          RM{vehicleTotal.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },

    // Modern Header Styles
    modernHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    appLogo: {
      width: 32,
      height: 32,
      backgroundColor: '#F59E0B',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appName: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111827',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      flex: 1,
      maxWidth: 400,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: '#111827',
    },
    searchShortcuts: {
      flexDirection: 'row',
      gap: 4,
    },
    shortcutKey: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 12,
      color: '#6B7280',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    userAvatar: {
      width: 32,
      height: 32,
      backgroundColor: '#F59E0B',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userAvatarText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    userInfo: {
      alignItems: 'flex-start',
    },
    userName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#111827',
    },
    userRole: {
      fontSize: 12,
      color: '#6B7280',
    },

    // Page Header
    pageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 24,
      flexWrap: 'wrap',
      gap: 12,
    },
    pageHeaderMobile: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    pageTitle: {
      fontSize: layout.isMobile ? 24 : 30,
      fontWeight: '600',
      color: '#111827',
    },
    dateRangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    dateRangeText: {
      fontSize: 14,
      color: '#374151',
    },

    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      gap: 24,
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    statsGridMobile: {
      flexDirection: 'column',
      gap: 16,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: layout.isMobile ? 12 : 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statTitle: {
      fontSize: 14,
      color: '#6B7280',
    },
    statValue: {
      fontSize: layout.isMobile ? 20 : 24,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
    },
    statFooter: {
      flexDirection: 'column',
      gap: 4,
    },
    statChange: {
      fontSize: 12,
      fontWeight: '600',
    },
    statLastMonth: {
      fontSize: 12,
      color: '#6B7280',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },

    // Charts Row
    chartsRow: {
      flexDirection: 'row',
      gap: 24,
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    chartsRowMobile: {
      flexDirection: 'column',
      gap: 16,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    chartContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: layout.isMobile ? 16 : 24,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    chartSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 16,
    },
    periodSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 8,
    },
    periodText: {
      fontSize: 14,
      color: '#6B7280',
    },
    chartContent: {
      flexDirection: 'row',
      height: 128,
      alignItems: 'flex-end',
    },
    yAxisLabels: {
      justifyContent: 'space-between',
      height: '100%',
      marginRight: 12,
    },
    yAxisLabel: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    barsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: '100%',
      gap: 8,
    },
    barItem: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
    },
    barWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
    },
    bar: {
      width: 16,
      borderRadius: 2,
      position: 'relative',
    },
    barTooltip: {
      position: 'absolute',
      top: -28,
      backgroundColor: '#F59E0B',
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tooltipText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    barLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 8,
    },
    chartLegend: {
      flexDirection: 'row',
      gap: 24,
      marginBottom: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 14,
      color: '#6B7280',
    },
    stackedBarWrapper: {
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      height: '100%',
    },
    stackedBar: {
      width: 12,
    },

    // Table Styles
    tableContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    tableHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    tableHeaderLeft: {
      flex: 1,
    },
    tableTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    tableHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    tableSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    tableSearchInput: {
      fontSize: 14,
      color: '#111827',
      minWidth: 60,
    },
    tableSortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    tableSortText: {
      fontSize: 14,
      color: '#6B7280',
    },
    tableContent: {
      padding: layout.isMobile ? 12 : 24,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
    },
    tableHeaderText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6B7280',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: layout.isMobile ? 16 : 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    tableCell: {
      flex: 1,
      paddingRight: layout.isMobile ? 8 : 16,
    },
    tableCellText: {
      fontSize: layout.isMobile ? 12 : 14,
      color: '#111827',
    },
    boldText: {
      fontWeight: '600',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#D1D5DB',
    },
    statusCell: {
      alignItems: 'flex-start',
    },
    statusBadge: {
      backgroundColor: '#D1FAE5',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#065F46',
    },

    // Quick Actions (keeping simplified version)
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    quickActionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      alignItems: 'center',
      gap: 12,
      width: '48%',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
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
      color: '#111827',
      textAlign: 'center',
    },

    // Loading and Empty States
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

  return (
    <View style={styles.container}>
      <ModernHeader />

      <View style={layout.isDesktop ? styles.pageHeader : styles.pageHeaderMobile}>
        <Text style={styles.pageTitle}>Vehicle Overview</Text>
        <View style={{ width: layout.isMobile ? '100%' : 'auto' }}>
          <DateRangeFilter
            selectedRange={dateRange}
            onRangeChange={setDateRange}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {analytics && (
          <View style={layout.isDesktop ? styles.statsGrid : styles.statsGridMobile}>
            <StatCard
              title="Total Expenses"
              value={`RM${analytics.totalExpenses.toFixed(2)}`}
              change={analytics.fuelTrend > 0 ? `${analytics.fuelTrend.toFixed(1)}%` : undefined}
              changeType={analytics.fuelTrend >= 0 ? 'up' : 'down'}
              lastMonth={`RM${(analytics.totalExpenses * 0.85).toFixed(2)}`}
              icon={<IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#6B7280" />}
            />
            <StatCard
              title="Active Vehicles"
              value={vehicles.length.toString()}
              change={analytics.vehiclesTrend > 0 ? `${analytics.vehiclesTrend.toFixed(1)}%` : undefined}
              changeType="up"
              lastMonth={(vehicles.length - 1).toString()}
              icon={<IconSymbol name="car.fill" size={20} color="#6B7280" />}
            />
            <StatCard
              title="Fuel Costs"
              value={`RM${analytics.fuelCosts.toFixed(2)}`}
              change={analytics.fuelTrend > 0 ? `${analytics.fuelTrend.toFixed(1)}%` : undefined}
              changeType={analytics.fuelTrend >= 0 ? 'up' : 'down'}
              lastMonth={`RM${(analytics.fuelCosts * 0.9).toFixed(2)}`}
              icon={<IconSymbol name="fuelpump" size={20} color="#6B7280" />}
            />
            <StatCard
              title="Service Costs"
              value={`RM${analytics.serviceCosts.toFixed(2)}`}
              change={analytics.serviceTrend > 0 ? `${analytics.serviceTrend.toFixed(1)}%` : undefined}
              changeType={analytics.serviceTrend >= 0 ? 'up' : 'down'}
              lastMonth={`RM${(analytics.serviceCosts * 0.8).toFixed(2)}`}
              icon={<IconSymbol name="wrench" size={20} color="#6B7280" />}
            />
          </View>
        )}

        <View style={layout.isDesktop ? styles.chartsRow : styles.chartsRowMobile}>
          <BarChart />
          <ProfitLossChart />
        </View>

        <View style={[styles.tableContainer, { marginHorizontal: layout.isDesktop ? 24 : 16 }]}>
          <View style={styles.tableHeader}>
            <View style={styles.tableHeaderLeft}>
              <Text style={styles.tableTitle}>Recent Vehicles</Text>
            </View>
            <View style={styles.tableHeaderRight}>
              <View style={styles.tableSearchContainer}>
                <IconSymbol name="magnifyingglass" size={16} color={colors.icon} />
                <TextInput
                  style={styles.tableSearchInput}
                  placeholder="Search"
                  placeholderTextColor={colors.icon}
                />
              </View>
              <TouchableOpacity style={styles.tableSortButton}>
                <Text style={styles.tableSortText}>Sort by</Text>
                <IconSymbol name="chevron.down" size={14} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableContent}>
            {!layout.isMobile && (
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.tableCell]}>Vehicle Id</Text>
                {layout.isDesktop && (
                  <Text style={[styles.tableHeaderText, styles.tableCell]}>Date</Text>
                )}
                <Text style={[styles.tableHeaderText, styles.tableCell]}>Vehicle</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell]}>Plate</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell]}>Status</Text>
                {layout.isDesktop && (
                  <Text style={[styles.tableHeaderText, styles.tableCell]}>Usage</Text>
                )}
                <Text style={[styles.tableHeaderText, styles.tableCell]}>Total</Text>
              </View>
            )}

            {vehicles.slice(0, 5).map((vehicle, index) => (
              <VehicleTableRow key={vehicle.id} vehicle={vehicle} index={index} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
