import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { IconSymbol } from "./icon-symbol";
import { GroupService } from "@/lib/services/groupService";
import { Group } from "@/types/database-v2";

interface GroupSelectorProps {
  selectedGroupIds: string[];
  onSelectionChange: (groupIds: string[]) => void;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  maxSelections?: number;
  style?: any;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedGroupIds,
  onSelectionChange,
  title = "Share with Groups",
  subtitle = "Select which groups can see this vehicle",
  disabled = false,
  maxSelections,
  style,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const result = await GroupService.getGroups();
      if (result.error) {
        Alert.alert("Error", "Failed to load groups");
      } else {
        setGroups(result.data || []);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const isCurrentlySelected = selectedGroupIds.includes(groupId);
    let newSelection: string[];

    if (isCurrentlySelected) {
      // Remove from selection
      newSelection = selectedGroupIds.filter((id) => id !== groupId);
    } else {
      // Add to selection
      if (maxSelections && selectedGroupIds.length >= maxSelections) {
        Alert.alert(
          "Selection Limit",
          `You can only select up to ${maxSelections} group${maxSelections > 1 ? "s" : ""}.`,
        );
        return;
      }
      newSelection = [...selectedGroupIds, groupId];
    }

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedGroupIds.length === groups.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all (or up to max)
      const allIds = groups.map((g) => g.id);
      const newSelection = maxSelections
        ? allIds.slice(0, maxSelections)
        : allIds;
      onSelectionChange(newSelection);
    }
  };

  const getSelectedGroupNames = () => {
    return groups
      .filter((group) => selectedGroupIds.includes(group.id))
      .map((group) => group.name);
  };

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    header: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    selector: {
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.19),
      borderRadius: 8,
      padding: spacing.md,
      backgroundColor: colors.background,
    },
    selectorContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectorText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    placeholderText: {
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    chevron: {
      marginLeft: spacing.sm,
    },
    countBadge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginRight: spacing.sm,
    },
    countText: {
      fontSize: 12,
      fontWeight: "600",
      color: "white",
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: withOpacity(baseColors.black, 0.5),
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.xl,
      width: "90%",
      maxWidth: 400,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.12),
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: spacing.xs,
    },
    selectAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.primary,
      marginLeft: spacing.sm,
    },
    groupsList: {
      maxHeight: 300,
    },
    groupItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.06),
    },
    groupInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    groupName: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    groupDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    memberCount: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: withOpacity(colors.textSecondary, 0.31),
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxIcon: {
      marginTop: -spacing.xs,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: "italic",
      paddingVertical: spacing.xl,
    },
    loadingText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.textSecondary,
      paddingVertical: spacing.xl,
    },
  });

  const selectedNames = getSelectedGroupNames();
  const displayText =
    selectedNames.length > 0
      ? selectedNames.length === 1
        ? selectedNames[0]
        : `${selectedNames.length} groups selected`
      : "No groups selected";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity
        style={[styles.selector, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Text
            style={[
              styles.selectorText,
              selectedNames.length === 0 && styles.placeholderText,
            ]}
          >
            {displayText}
          </Text>

          {selectedGroupIds.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{selectedGroupIds.length}</Text>
            </View>
          )}

          <IconSymbol
            name="chevron.down"
            size={16}
            color={colors.textSecondary}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Groups</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <IconSymbol
                  name="xmark"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {groups.length > 1 && (
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedGroupIds.length === groups.length &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selectedGroupIds.length === groups.length && (
                    <IconSymbol
                      name="checkmark"
                      size={12}
                      color="white"
                      style={styles.checkboxIcon}
                    />
                  )}
                </View>
                <Text style={styles.selectAllText}>
                  {selectedGroupIds.length === groups.length
                    ? "Deselect All"
                    : "Select All"}
                </Text>
              </TouchableOpacity>
            )}

            <ScrollView
              style={styles.groupsList}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <Text style={styles.loadingText}>Loading groups...</Text>
              ) : groups.length === 0 ? (
                <Text style={styles.emptyText}>
                  No groups available. Create a group first to enable sharing.
                </Text>
              ) : (
                groups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);

                  return (
                    <TouchableOpacity
                      key={group.id}
                      style={styles.groupItem}
                      onPress={() => handleGroupToggle(group.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <IconSymbol
                            name="checkmark"
                            size={12}
                            color="white"
                            style={styles.checkboxIcon}
                          />
                        )}
                      </View>

                      <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {group.description && (
                          <Text
                            style={styles.groupDescription}
                            numberOfLines={1}
                          >
                            {group.description}
                          </Text>
                        )}
                        <Text style={styles.memberCount}>
                          {/* This would need to be populated from the group data */}
                          Group • Tap to {isSelected ? "remove" : "share"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Quick sharing toggle component
interface QuickSharingToggleProps {
  isShared: boolean;
  onToggle: (shared: boolean) => void;
  groupCount: number;
  disabled?: boolean;
}

export const QuickSharingToggle: React.FC<QuickSharingToggleProps> = ({
  isShared,
  onToggle,
  groupCount,
  disabled = false,
}) => {
  const { theme } = useStyles();
  const colors = theme.colors;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isShared
        ? withOpacity(colors.primary, 0.19)
        : withOpacity(colors.textSecondary, 0.12),
    },
    content: {
      flex: 1,
      marginRight: spacing.md,
    },
    title: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    toggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: isShared
        ? colors.primary
        : withOpacity(colors.textSecondary, 0.19),
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
    },
    toggleButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "white",
      alignSelf: isShared ? "flex-end" : "flex-start",
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, disabled && { opacity: 0.5 }]}
      onPress={() => !disabled && onToggle(!isShared)}
      disabled={disabled}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Share with Groups</Text>
        <Text style={styles.subtitle}>
          {isShared
            ? groupCount > 0
              ? `Shared with ${groupCount} group${groupCount === 1 ? "" : "s"}`
              : "Sharing enabled but no groups selected"
            : "Keep vehicle private"}
        </Text>
      </View>

      <View style={styles.toggle}>
        <View style={styles.toggleButton} />
      </View>
    </TouchableOpacity>
  );
};
