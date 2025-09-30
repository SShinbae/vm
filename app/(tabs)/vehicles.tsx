import { useDialog } from '@/lib/contexts/DialogContext';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { formatDateWithPrefix } from '@/lib/utils/dateUtils';
import { VehicleWithDetails } from '@/types/database-v2';

export default function VehiclesScreen() {
  const [allVehicles, setAllVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();
  const dialog = useDialog();

  const fetchData = useCallback(async () => {
    const vehiclesResult = await VehicleService.getVehiclesSeparated();

    if (vehiclesResult.error) {
      dialog.showError('Error', 'Failed to load vehicles');
      console.error('Failed to fetch vehicles:', vehiclesResult.error);
    } else if (vehiclesResult.data) {
      // Combine own and shared vehicles into one array
      const combinedVehicles = [
        ...vehiclesResult.data.ownVehicles,
        ...vehiclesResult.data.sharedVehicles
      ];
      setAllVehicles(combinedVehicles);
      console.log('🚗 Vehicles loaded:', {
        totalCount: combinedVehicles.length
      });
    }

    setLoading(false);
  }, [dialog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleDeleteVehicle = (vehicle: VehicleWithDetails) => {
    dialog.alert(
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
              dialog.showError('Error', 'Failed to delete vehicle');
            } else {
              setAllVehicles(prev => prev.filter(v => v.id !== vehicle.id));
              dialog.showSuccess('Success', 'Vehicle deleted successfully');
            }
            dialog.hideConfirm();
          },
        },
      ]
    );
  };

  const VehicleCard = ({ vehicle }: { vehicle: VehicleWithDetails }) => {
    const [imageError, setImageError] = React.useState(false);

    // Check if image URL is valid
    const isValidImageUrl = (url: string | null) => {
      if (!url) return false;
      // Check for common invalid patterns
      if (url.startsWith('file://')) return false;
      if (url.includes('undefined') || url.includes('null')) return false;
      return true;
    };

    const imageUrl = vehicle.main_image_url && isValidImageUrl(vehicle.main_image_url) 
      ? vehicle.main_image_url 
      : null;

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
      >
        <View style={styles.vehicleHeader}>
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.vehicleImage, !vehicle.is_own_vehicle && styles.groupVehicleImage]}
              resizeMode="cover"
              onError={(error) => {
                console.error('Image load error for vehicle:', vehicle.id, error.nativeEvent);
                console.log('Failed URL:', imageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully for vehicle:', vehicle.id);
              }}
            />
          ) : (
            <View style={[styles.vehicleIcon, !vehicle.is_own_vehicle && styles.groupVehicleIcon]}>
              <IconSymbol name={!vehicle.is_own_vehicle ? "person.3.fill" : "car.fill"} size={24} color="white" />
            </View>
          )}
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleNameRow}>
            <Text style={styles.vehicleName}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            {!vehicle.is_own_vehicle && (
              <View style={styles.sharedBadge}>
                <IconSymbol name="person.3.fill" size={12} color="white" />
              </View>
            )}
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
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
    quickActionsContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    quickActionCard: {
      flex: 1,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    vehicleImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
      backgroundColor: colors.surface,
      overflow: 'hidden', // Ensures borderRadius works on web
    },
    groupVehicleImage: {
      borderWidth: 2,
      borderColor: '#10B981',
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
      color: colors.textSecondary,
      marginTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.isMobile ? 16 : 24,
      paddingVertical: 20,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
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
      backgroundColor: colors.background,
    },
    emptySectionIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptySectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vehicleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addedDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tableSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      minWidth: layout.isMobile ? 100 : 200,
    },
    tableSearchInput: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    tableSortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    tableSortText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  const QuickActionCard = ({ title, icon, onPress, color }: any) => (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: color + '30' }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <WebLayout>
        <View style={styles.header}>
          <Text style={styles.greeting}>Vehicles</Text>
          <Text style={styles.subtitle}>Manage your fleet and maintenance</Text>
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
            <View style={styles.quickActionsContainer}>
              <QuickActionCard
                title="Add Vehicle"
                icon="plus.circle.fill"
                color={colors.tint}
                onPress={() => router.push('/vehicles/add')}
              />
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
            </View>
          </View>

          {/* My Vehicles Section */}
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>My Vehicles</Text>
              <Text style={styles.sectionSubtitle}>All your vehicles in one place</Text>
            </View>
            {layout.isDesktop && allVehicles.length > 0 && (
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
              <Text style={styles.sectionCountText}>{allVehicles.length}</Text>
            </View>
          </View>

          {allVehicles.length === 0 ? (
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
                  {allVehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </ResponsiveGrid>
              ) : (
                allVehicles.map(vehicle => (
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