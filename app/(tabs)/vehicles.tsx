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
import { VehicleService } from '../../lib/services/vehicleService';

import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { WebLayout } from '@/components/layout/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { formatDateWithPrefix } from '@/lib/utils/dateUtils';
import { ServiceTemplate } from '@/types';
import { VehicleWithDetails } from '@/types/database-v2';

type TabType = 'vehicles' | 'services';

export default function VehiclesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const [ownVehicles, setOwnVehicles] = useState<VehicleWithDetails[]>([]);
  const [sharedVehicles, setSharedVehicles] = useState<VehicleWithDetails[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const TabButton = ({ type, label, icon }: { type: TabType; label: string; icon: string }) => (
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
        color={activeTab === type ? 'white' : colors.icon}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === type ? 'white' : colors.icon },
        ]}
      >
        {label}
      </Text>
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
    // Tab styles
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      backgroundColor: colors.background,
      gap: 8,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    // Service card styles
    serviceCard: {
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
    serviceHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    serviceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    serviceDescription: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    serviceItemCount: {
      fontSize: 12,
      color: colors.icon,
    },
    serviceCost: {
      alignItems: 'flex-end',
    },
    serviceCostText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.tint,
    },
    serviceItems: {
      marginBottom: 12,
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    serviceItemDescription: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      marginRight: 12,
    },
    serviceItemPrice: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.icon,
    },
    moreItems: {
      fontSize: 12,
      color: colors.icon,
      fontStyle: 'italic',
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.icon + '10',
      paddingTop: 12,
    },
    editButton: {
      padding: 8,
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
            onPress={() => router.push(activeTab === 'vehicles' ? '/vehicles/add' : '/vehicles/services/add')}
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
          {activeTab === 'vehicles' ? (
            <>
              {/* My Vehicles Section */}
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