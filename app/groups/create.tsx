import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GroupService } from "@/lib/services/groupService";
import { GroupFormData } from "@/types";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function CreateGroupScreen() {
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isWeb = Platform.OS === "web";

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    setLoading(true);

    const groupData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    const { data, error } = await GroupService.createGroup(groupData);
    setLoading(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      Alert.alert("Success", "Group created successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    }
  };

  const isFormValid = () => {
    return formData.name.trim().length > 0;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    saveButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    formCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.icon + "20",
      marginBottom: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: "#ff4444",
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    helpText: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 4,
      lineHeight: 16,
    },
    infoCard: {
      backgroundColor: colors.tint + "10",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.tint + "30",
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    featureList: {
      gap: 8,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    featureText: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Group</Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid() || loading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <IconSymbol name="checkmark" size={14} color="white" />
                <Text style={styles.saveButtonText}>Create</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Group Name <Text style={styles.requiredLabel}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Family Cars"
                  placeholderTextColor={colors.icon}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Text style={styles.helpText}>
                  Choose a descriptive name for your group
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="Share information about our family vehicles..."
                  placeholderTextColor={colors.icon}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.helpText}>
                  Describe the purpose of this group to help members understand
                  its goals
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <IconSymbol name="info.circle" size={20} color={colors.tint} />
            </View>
            <Text style={styles.infoTitle}>About Groups</Text>
            <Text style={styles.infoText}>
              Groups allow you to share vehicle information with family members
              or friends. As the group owner, you can invite members and manage
              group settings.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.featureText}>
                  Share vehicle maintenance logs
                </Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.featureText}>
                  View group members&apos; shared vehicles
                </Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.featureText}>
                  Privacy-first: only shared vehicles are visible
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
