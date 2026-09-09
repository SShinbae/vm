import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { spacing } from "@/src/design-system";
import { GroupService } from "@/lib/services/groupService";
import { useToast } from "@/hooks/useToast";
import { GroupFormData } from "@/types";
import { router, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useStyles } from "react-native-unistyles";

export default function CreateGroupScreen() {
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const posthog = usePostHog();
  const navigation = useRouter();
  const { theme } = useStyles();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/groups");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError("Please enter a group name");
      return;
    }

    setLoading(true);

    const groupData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    const { error } = await GroupService.createGroup(groupData);
    setLoading(false);

    if (error) {
      showError(error);
    } else {
      posthog?.capture("group_created");
      showSuccess("Group created successfully!");
      handleGoBack();
    }
  };

  const validateName = (value: string) => {
    if (!value.trim()) return "Group name is required";
    if (value.trim().length < 2)
      return "Group name must be at least 2 characters";
    return undefined;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <PageHeader title="Create Group" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Create Group
        </Text>
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
        >
          Create a new group to share vehicles and collaborate with family or
          team members
        </Text>
        <Input
          label="Group Name"
          value={formData.name}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, name: text }))
          }
          placeholder="Family, Work Team, etc."
          required
          error={formData.name ? validateName(formData.name) : undefined}
          helperText="Choose a name that identifies your group"
          leftIcon="people"
        />

        <Input
          label="Description (Optional)"
          value={formData.description || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, description: text }))
          }
          placeholder="Describe the purpose of this group..."
          multiline
          numberOfLines={3}
          helperText="Help members understand what this group is for"
        />
      </ScrollView>
      <View
        style={[
          styles.actions,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Button
          title="Cancel"
          variant="outline"
          onPress={handleGoBack}
          disabled={loading}
          style={styles.button}
        />
        <Button
          title="Create Group"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { fontSize: 24, fontWeight: "700", marginBottom: spacing.sm },
  description: { fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  button: { flex: 1 },
});
