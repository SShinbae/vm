import { IconSymbol } from '@/components/ui/icon-symbol';
import { VehicleGroupSelector } from '@/components/VehicleGroupSelector';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDate } from '@/lib/utils/dateUtils';
import { VehicleWithDetails } from '@/types/database-v2';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface VehicleDetailProps {
  vehicle: VehicleWithDetails;
  onVehicleUpdate: () => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle,
  onVehicleUpdate,
}) => {
  const [showSharingModal, setShowSharingModal] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSharingUpdate = (success: boolean) => {
    setShowSharingModal(false);
    if (success) {
      onVehicleUpdate();
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    vehicleIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: vehicle.is_own_vehicle ? colors.tint : '#4CAF50',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    vehiclePlate: {
      fontSize: 16,
      color: colors.icon,
      fontWeight: '500',
    },
    ownerInfo: {
      fontSize: 14,
      color: '#4CAF50',
      fontStyle: 'italic',
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    sharingSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    sharingStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sharingText: {
      fontSize: 16,
      color: colors.text,
    },
    shareButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    shareButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    sharedGroupsList: {
      marginTop: 8,
    },
    sharedGroupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    sharedGroupText: {
      fontSize: 14,
      color: colors.icon,
      marginLeft: 8,
    },
    emptySharing: {
      textAlign: 'center',
      color: colors.icon,
      fontSize: 14,
      fontStyle: 'italic',
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    detailsGrid: {
      gap: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    detailIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.icon,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Header */}
      <View style={styles.header}>
        <View style={styles.vehicleIcon}>
          <IconSymbol 
            name={vehicle.is_own_vehicle ? "car.fill" : "person.3.fill"} 
            size={30} 
            color="white" 
          />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
          {!vehicle.is_own_vehicle && vehicle.owner_profile && (
            <Text style={styles.ownerInfo}>
              Owned by {vehicle.owner_profile.full_name || vehicle.owner_profile.email}
            </Text>
          )}
        </View>
      </View>

      {/* Vehicle Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <IconSymbol name="speedometer" size={20} color={colors.tint} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Current Mileage</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  // Try current_mileage first, then latest mileage log, then show no data
                  const currentMileage = vehicle.current_mileage && vehicle.current_mileage > 0
                    ? vehicle.current_mileage
                    : vehicle.logs?.latest_mileage?.odometer_reading;

                  return currentMileage ? `${currentMileage.toLocaleString()} km` : 'No data';
                })()}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <IconSymbol name="fuelpump.fill" size={20} color={colors.tint} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fuel Records</Text>
              <Text style={styles.detailValue}>
                {vehicle.logs?.latest_fuel ?
                  `${vehicle.logs.latest_fuel.liters_filled}L on ${formatDate(vehicle.logs.latest_fuel.date)}` :
                  'No records'
                }
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <IconSymbol name="wrench.and.screwdriver.fill" size={20} color={colors.tint} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Records</Text>
              <Text style={styles.detailValue}>
                {vehicle.logs?.latest_service ?
                  `${vehicle.logs.latest_service.service_type} on ${formatDate(vehicle.logs.latest_service.date)}` :
                  'No records'
                }
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <IconSymbol name="list.bullet.clipboard.fill" size={20} color={colors.tint} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Mileage Records</Text>
              <Text style={styles.detailValue}>
                {vehicle.logs?.latest_mileage ?
                  `${vehicle.logs.latest_mileage.odometer_reading.toLocaleString()} km on ${formatDate(vehicle.logs.latest_mileage.date)}` :
                  'No records'
                }
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sharing Section - Only for owned vehicles */}
      {vehicle.is_own_vehicle && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Sharing</Text>
          <View style={styles.sharingSection}>
            <View style={styles.sharingStatus}>
              <Text style={styles.sharingText}>
                {vehicle.shared_groups?.length ?
                  `Shared with ${vehicle.shared_groups.length} group${vehicle.shared_groups.length > 1 ? 's' : ''}` :
                  'Not shared with any groups'
                }
              </Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => setShowSharingModal(true)}
              >
                <IconSymbol name="person.3.fill" size={14} color="white" />
                <Text style={styles.shareButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {vehicle.shared_groups && vehicle.shared_groups.length > 0 ? (
              <View style={styles.sharedGroupsList}>
                {vehicle.shared_groups.map(group => (
                  <View key={group.id} style={styles.sharedGroupItem}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#4CAF50" />
                    <Text style={styles.sharedGroupText}>{group.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySharing}>
                Share this vehicle with your groups to let members view and log activities.
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Sharing Modal */}
      <Modal
        visible={showSharingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSharingModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Vehicle Sharing</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSharingModal(false)}
              >
                <IconSymbol name="xmark" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <VehicleGroupSelector
              vehicleId={vehicle.id}
              currentSharedGroups={vehicle.shared_groups || []}
              onSharingUpdate={handleSharingUpdate}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};