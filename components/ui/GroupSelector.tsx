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
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.icon,
      lineHeight: 18,
    },
    selector: {
      borderWidth: 1,
      borderColor: colors.icon + "30",
      borderRadius: 8,
      padding: 12,
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
      color: colors.icon,
      fontStyle: "italic",
    },
    chevron: {
      marginLeft: 8,
    },
    countBadge: {
      backgroundColor: colors.tint,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginRight: 8,
    },
    countText: {
      fontSize: 12,
      fontWeight: "600",
      color: "white",
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      width: "90%",
      maxWidth: 400,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    selectAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      marginBottom: 12,
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.tint,
      marginLeft: 8,
    },
    groupsList: {
      maxHeight: 300,
    },
    groupItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "10",
    },
    groupInfo: {
      flex: 1,
      marginLeft: 12,
    },
    groupName: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    groupDescription: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 2,
    },
    memberCount: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 2,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.icon + "50",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    checkboxIcon: {
      marginTop: -1,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.icon,
      fontStyle: "italic",
      paddingVertical: 20,
    },
    loadingText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.icon,
      paddingVertical: 20,
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
            color={colors.icon}
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
                <IconSymbol name="xmark" size={20} color={colors.icon} />
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isShared ? colors.tint + "30" : colors.icon + "20",
    },
    content: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 2,
    },
    toggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: isShared ? colors.tint : colors.icon + "30",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    toggleButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "white",
      alignSelf: isShared ? "flex-end" : "flex-start",
      shadowColor: "#000",
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
