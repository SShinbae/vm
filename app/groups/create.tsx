import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/contexts/AuthContext";
import { spacing } from "@/src/design-system";
import { GroupService } from "@/lib/services/groupService";
import { useToast } from "@/hooks/useToast";
import { GroupFormData } from "@/types";
import { router, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Text,
  View,
} from "react-native";
import { useStyles } from "react-native-unistyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";

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
  const { styles: web } = useStyles(webPageStyles);
  const layout = useResponsiveLayout();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale >= 1.3;
  const { user } = useAuth();
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/groups");
    }
  };

  const handleSave = async () => {
    if (pending.current) return;
    if (!formData.name.trim()) {
      showError("Please enter a group name");
      return;
    }
    const validationError = validateName(formData.name);
    if (validationError) {
      showError(validationError);
      return;
    }
    const userId = user?.id;
    pending.current = true;
    setLoading(true);
    try {
      const { error } = await GroupService.createGroup({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });
      if (!mounted.current || currentUser.current !== userId) return;
      if (error) showError(error);
      else {
        posthog?.capture("group_created");
        showSuccess("Group created successfully!");
        handleGoBack();
      }
    } catch {
      if (mounted.current && currentUser.current === userId)
        showError("Couldn't create group. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const validateName = (value: string) => {
    if (!value.trim()) return "Group name is required";
    if (value.trim().length < 2)
      return "Group name must be at least 2 characters";
    return undefined;
  };

  const fields = (
    <>
      <Input
        label="Group Name"
        accessibilityLabel="Group Name"
        editable={!loading}
        inputStyle={{ minHeight: 48 }}
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
        accessibilityLabel="Group description"
        editable={!loading}
        inputStyle={{ minHeight: 96, textAlignVertical: "top" }}
        value={formData.description || ""}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, description: text }))
        }
        placeholder="Describe the purpose of this group..."
        multiline
        numberOfLines={3}
        helperText="Help members understand what this group is for"
      />
    </>
  );
  const actions = (
    <>
      <Button
        title="Cancel"
        variant="outline"
        onPress={handleGoBack}
        disabled={loading}
        style={{
          flex: stacked && !(layout.isWeb && !layout.isMobile) ? undefined : 1,
          minHeight: 48,
        }}
      />
      <Button
        title="Create Group"
        onPress={handleSave}
        loading={loading}
        style={{
          flex: stacked && !(layout.isWeb && !layout.isMobile) ? undefined : 1,
          minHeight: 48,
        }}
      />
    </>
  );

  if (layout.isWeb && !layout.isMobile) {
    return (
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View
          style={[
            web.frame,
            {
              flex: 0,
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.xl,
            },
          ]}
        >
          <View
            style={[
              web.panel,
              { width: "100%", maxWidth: 640, alignSelf: "center" },
            ]}
          >
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary },
              ]}
            >
              Create a group to share vehicles with family, friends, or your
              team.
            </Text>
            {fields}
            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.md,
                marginTop: theme.spacing.lg,
              }}
            >
              {actions}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        enabled={Platform.OS !== "web"}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <MobilePageHeader
            title="Create Group"
            subtitle="Share vehicles with family, friends, or your team"
            onBack={() => {
              if (!pending.current) handleGoBack();
            }}
          />
          {fields}
          <View
            style={{
              flexDirection: stacked ? "column" : "row",
              gap: 12,
              marginTop: 16,
            }}
          >
            {actions}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
