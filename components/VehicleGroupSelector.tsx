import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleService } from "@/lib/services/vehicleService";
import { Group } from "@/types";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VehicleGroupSelectorProps {
  vehicleId: string;
  currentSharedGroups: Group[];
  onSharingUpdate: (success: boolean) => void;
}

export const VehicleGroupSelector: React.FC<VehicleGroupSelectorProps> = ({
  vehicleId,
  currentSharedGroups,
  onSharingUpdate,
}) => {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    currentSharedGroups.map((g) => g.id),
  );
  const [loading, setLoading] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await VehicleService.getUserGroups();
      if (data && !error) {
        setAvailableGroups(data);
        console.log("📋 Fetched user groups:", data.length);
      } else {
        console.error("Error fetching user groups:", error);
      }
    } catch {
      console.error("Error fetching user groups");
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const handleSaveSharing = async () => {
    setLoading(true);
    try {
      const { error } = await VehicleService.shareVehicleWithGroups(
        vehicleId,
        selectedGroups,
      );

      if (error) {
        Alert.alert("Error", "Failed to update vehicle sharing");
        onSharingUpdate(false);
      } else {
        Alert.alert("Success", "Vehicle sharing updated successfully");
        onSharingUpdate(true);
      }
    } catch {
      Alert.alert("Error", "Failed to update vehicle sharing");
      onSharingUpdate(false);
    }
    setLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      padding: spacing.xl,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    groupItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.12),
    },
    selectedGroup: {
      backgroundColor: withOpacity(colors.primary, 0.06),
      borderColor: colors.primary,
    },
    groupName: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: spacing.md,
    },
    checkIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    checkedIcon: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 8,
      alignItems: "center",
      marginTop: spacing.xl,
    },
    saveButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: spacing.xl,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share with Groups</Text>

      {availableGroups.length === 0 ? (
        <Text style={styles.emptyText}>
          No groups available. Create or join a group to share vehicles.
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {availableGroups.map((group) => {
            const isSelected = selectedGroups.includes(group.id);
            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupItem, isSelected && styles.selectedGroup]}
                onPress={() => handleGroupToggle(group.id)}
              >
                <View
                  style={[styles.checkIcon, isSelected && styles.checkedIcon]}
                >
                  {isSelected && (
                    <IconSymbol name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text style={styles.groupName}>{group.name}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSharing}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};
