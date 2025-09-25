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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VehicleService } from '../../lib/services/vehicleService';

import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { WebLayout } from '@/components/layout/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { formatDateWithPrefix } from '@/lib/utils/dateUtils';
import { ServiceTemplate } from '@/types';
import { VehicleWithDetails } from '@/types/database-v2';

type TabType = 'vehicles' | 'services';

export default function VehiclesScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const [ownVehicles, setOwnVehicles] = useState<VehicleWithDetails[]>([]);
  const [sharedVehicles, setSharedVehicles] = useState<VehicleWithDetails[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const fetchData = useCallback(async () => {
    const [vehiclesResult, servicesResult] = await Promise.all([
      VehicleService.getVehiclesSeparated(),
      VehicleService.getServiceTemplates(),
    ]);

    if (vehiclesResult.error) {
      Alert.alert('Error', 'Failed to load vehicles');
      console.error('Failed to fetch vehicles:', vehiclesResult.error);
    } else if (vehiclesResult.data) {
      setOwnVehicles(vehiclesResult.data.ownVehicles);
      setSharedVehicles(vehiclesResult.data.sharedVehicles);
      console.log('🚗 Vehicles loaded:', {
        ownCount: vehiclesResult.data.ownVehicles.length,
        sharedCount: vehiclesResult.data.sharedVehicles.length
      });
    }

    if (servicesResult.data) {
      setServiceTemplates(servicesResult.data);
      console.log('🔧 Service templates loaded:', servicesResult.data.length);
    }

    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
            const { error } = await VehicleService.deleteVehicle(vehicle.id);
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

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${serviceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await VehicleService.deleteServiceTemplate(serviceId);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              setServiceTemplates(prev => prev.filter(s => s.id !== serviceId));
              Alert.alert('Success', 'Service template deleted successfully');
            }
          },
        },
      ]
    );
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/vehicles/services/${serviceId}/edit` as any);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
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
              Shared by {vehicle.owner_profile.full_name || vehicle.owner_profile.email}
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

  const ServiceCard = ({ service }: { service: ServiceTemplate }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleEditService(service.id)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIcon}>
          <IconSymbol name="gear" size={20} color={colors.tint} />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          {service.description && (
            <Text style={styles.serviceDescription}>{service.description}</Text>
          )}
          <Text style={styles.serviceItemCount}>
            {service.items.length} item{service.items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.serviceCost}>
          <Text style={styles.serviceCostText}>
            RM{service.total_cost.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.serviceItems}>
        {service.items.slice(0, 2).map((item, index) => (
          <View key={item.id} style={styles.serviceItem}>
            <Text style={styles.serviceItemDescription} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.serviceItemPrice}>
              RM{item.price.toFixed(2)}
            </Text>
          </View>
        ))}
        {service.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{service.items.length - 2} more item{service.items.length - 2 !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEditService(service.id);
          }}
        >
          <IconSymbol name="pencil" size={18} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteService(service.id, service.name);
          }}
        >
          <IconSymbol name="trash" size={18} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );


  const TabButton = ({ type, label, icon }: { type: TabType; label: string; icon: any }) => (
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
        color={activeTab === type ? 'white' : colors.textSecondary}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === type ? 'white' : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    vehicleIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
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
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    sharedBadge: {
      backgroundColor: '#10B981',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    groupVehicleIcon: {
      backgroundColor: '#10B981',
    },
    ownerInfo: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '500',
      marginTop: 4,
    },
    sharingStatus: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.isMobile ? 16 : 24,
      paddingVertical: 20,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    sectionSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 2,
    },
    sectionCount: {
      backgroundColor: '#F59E0B',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      minWidth: 32,
      alignItems: 'center',
    },
    sectionCountText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    sectionContent: {
      padding: layout.isMobile ? 16 : 24,
    },
    emptySection: {
      paddingVertical: 60,
      paddingHorizontal: 24,
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    emptySectionIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptySectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySectionDescription: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 400,
    },
    deleteButton: {
      padding: 8,
    },
    vehicleDetails: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 12,
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vehicleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    addedDate: {
      fontSize: 12,
      color: '#6B7280',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: layout.isMobile ? 16 : 24,
      paddingVertical: 16,
      gap: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 8,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    quickActionsGrid: {
      gap: 16,
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
    serviceCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: layout.isMobile ? 16 : 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    serviceHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    serviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
    },
    serviceDescription: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 4,
    },
    serviceItemCount: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    serviceCost: {
      alignItems: 'flex-end',
    },
    serviceCostText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#F59E0B',
    },
    serviceItems: {
      marginBottom: 12,
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    serviceItemDescription: {
      flex: 1,
      fontSize: 14,
      color: '#111827',
      marginRight: 12,
    },
    serviceItemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
    },
    moreItems: {
      fontSize: 12,
      color: '#9CA3AF',
      fontStyle: 'italic',
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      paddingTop: 12,
    },
    editButton: {
      padding: 8,
    },
    tableSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      minWidth: layout.isMobile ? 100 : 200,
    },
    tableSearchInput: {
      fontSize: 14,
      color: '#111827',
      flex: 1,
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
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <WebLayout>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        </WebLayout>
      </SafeAreaView>
    );
  }

  const QuickActionCard = ({ title, icon, onPress, color }: any) => (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: color + '30' }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <WebLayout>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {activeTab === 'vehicles' ? 'Vehicles' : 'Service Templates'}
          </Text>
          <Text style={styles.subtitle}>Manage your fleet and maintenance</Text>
        </View>

      <View style={styles.tabs}>
        <TabButton type="vehicles" label="Vehicles" icon="car.fill" />
        <TabButton type="services" label="Services" icon="gear" />
      </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ResponsiveGrid minItemWidth={150} spacing={16} style={styles.quickActionsGrid}>
              <QuickActionCard
                title={`Add ${activeTab === 'vehicles' ? 'Vehicle' : 'Template'}`}
                icon="plus.circle.fill"
                color={colors.tint}
                onPress={() => router.push(activeTab === 'vehicles' ? '/vehicles/add' : '/vehicles/services/add')}
              />
              {activeTab === 'vehicles' && (
                <>
                  <QuickActionCard
                    title="Log Fuel"
                    icon="fuelpump.fill"
                    color={colors.chart.fuel}
                    onPress={() => router.push('/logs/fuel/add' as any)}
                  />
                  <QuickActionCard
                    title="Log Service"
                    icon="wrench.fill"
                    color={colors.chart.service}
                    onPress={() => router.push('/logs/service/add' as any)}
                  />
                </>
              )}
            </ResponsiveGrid>
          </View>
          {activeTab === 'vehicles' ? (
            <>
              {/* My Vehicles Section */}
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>My Vehicles</Text>
                  <Text style={styles.sectionSubtitle}>Vehicles you own and manage</Text>
                </View>
                {layout.isDesktop && ownVehicles.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.tableSearchContainer}>
                      <IconSymbol name="magnifyingglass" size={16} color={colors.icon} />
                      <TextInput
                        style={styles.tableSearchInput}
                        placeholder="Search"
                        value={tableSearchQuery}
                        onChangeText={setTableSearchQuery}
                        placeholderTextColor={colors.icon}
                      />
                    </View>
                    <TouchableOpacity style={styles.tableSortButton}>
                      <Text style={styles.tableSortText}>Sort by</Text>
                      <IconSymbol name="chevron.down" size={14} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                )}
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Shared Vehicles</Text>
                  <Text style={styles.sectionSubtitle}>Vehicles shared by group members</Text>
                </View>
                {layout.isDesktop && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.tableSearchContainer}>
                      <IconSymbol name="magnifyingglass" size={16} color={colors.icon} />
                      <TextInput
                        style={styles.tableSearchInput}
                        placeholder="Search"
                        value={tableSearchQuery}
                        onChangeText={setTableSearchQuery}
                        placeholderTextColor={colors.icon}
                      />
                    </View>
                    <TouchableOpacity style={styles.tableSortButton}>
                      <Text style={styles.tableSortText}>Sort by</Text>
                      <IconSymbol name="chevron.down" size={14} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                )}
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
                    Join a group where members share their vehicles for collaborative management and tracking.
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
            </>
          ) : (
            <>
              {/* Service Templates Section */}
              {serviceTemplates.length === 0 ? (
                <View style={styles.emptySection}>
                  <View style={styles.emptySectionIcon}>
                    <IconSymbol name="gear" size={24} color={colors.icon} />
                  </View>
                  <Text style={styles.emptySectionTitle}>No service templates yet</Text>
                  <Text style={styles.emptySectionDescription}>
                    Create service templates with descriptions and pricing that you can reuse when logging vehicle services.
                  </Text>
                </View>
              ) : (
                <View style={styles.sectionContent}>
                  {layout.isDesktop ? (
                    <ResponsiveGrid minItemWidth={350} spacing={16}>
                      {serviceTemplates.map(service => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </ResponsiveGrid>
                  ) : (
                    serviceTemplates.map(service => (
                      <ServiceCard key={service.id} service={service} />
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </WebLayout>
    </SafeAreaView>
  );
}