import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { GroupInvitationService } from "@/lib/services/groupService";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { useDialog } from "@/lib/contexts/DialogContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";

export default function InviteToGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { confirm } = useDialog();
  const { showError } = useToast();
  const posthog = usePostHog();
  const { theme } = useStyles();
  const { styles: web } = useStyles(webPageStyles);
  const layout = useResponsiveLayout();
  const colors = theme.colors;
  const navigation = useRouter();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace(`/groups/${id}`);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      showError("Please enter an email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      showError("Please enter a valid email address");
      return;
    }

    if (!id) {
      showError("Group not found");
      return;
    }

    setLoading(true);

    const { error } = await GroupInvitationService.sendInvitation(
      id,
      email.trim(),
    );
    setLoading(false);

    if (error) {
      showError("Couldn't send invitation", { message: error });
    } else {
      posthog?.capture("group_invitation_sent");
      const sentTo = email.trim();
      // Cancel/backdrop/back counts as "Done", same as before.
      const another = await confirm({
        title: "Invitation Sent",
        message: `An invitation has been sent to ${sentTo}`,
        confirmText: "Send Another",
        cancelText: "Done",
      });
      if (another) setEmail("");
      else handleGoBack();
    }
  };

  const getEmailValidationError = () => {
    if (!email.trim()) return undefined;
    return validateEmail(email.trim())
      ? undefined
      : "Please enter a valid email address";
  };

  const isFormValid = () => {
    return email.trim().length > 0 && validateEmail(email.trim());
  };

  const emailInput = (
    <Input
      label="Email Address"
      value={email}
      onChangeText={setEmail}
      placeholder="friend@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      required
      error={getEmailValidationError()}
      success={
        email.trim() && validateEmail(email.trim())
          ? "Valid email address"
          : undefined
      }
      helperText={
        !email.trim()
          ? "Enter the email address of the person you want to invite"
          : undefined
      }
      leftIcon="envelope"
    />
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
              {
                width: "100%",
                maxWidth: 640,
                alignSelf: "center",
                gap: theme.spacing.lg,
              },
            ]}
          >
            <Text style={{ color: colors.textSecondary }}>
              Invite someone by email to join this group.
            </Text>
            {emailInput}
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                How invitations work
              </Text>
              <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
                They can accept or decline in the app. Invitations expire after
                7 days, and the group owner can cancel pending invitations.
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: theme.spacing.md,
              }}
            >
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleGoBack}
                disabled={loading}
              />
              <Button
                title="Send Invitation"
                onPress={handleSendInvitation}
                disabled={!isFormValid()}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.12),
    },
    backButton: {
      marginRight: spacing.lg,
      padding: spacing.xs,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.xl,
    },
    section: {
      marginBottom: spacing.xxl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: withOpacity(colors.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    bulletPoint: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: spacing.sm,
    },
    bulletText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginLeft: spacing.sm,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Member</Text>
        <Button
          title="Send"
          onPress={handleSendInvitation}
          disabled={!isFormValid()}
          loading={loading}
          icon="paperplane.fill"
          size="small"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="default" padding="large">
            <CardContent>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Send Invitation</Text>

                {emailInput}
              </View>
            </CardContent>
          </Card>

          <Card variant="filled" padding="medium">
            <CardContent>
              <View style={styles.infoIcon}>
                <IconSymbol
                  name="info.circle"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.infoTitle}>How Invitations Work</Text>
              <Text style={styles.infoText}>When you send an invitation:</Text>

              <View style={styles.bulletPoint}>
                <IconSymbol name="circle.fill" size={4} color={colors.text} />
                <Text style={styles.bulletText}>
                  The person will receive an invitation to join this group
                </Text>
              </View>

              <View style={styles.bulletPoint}>
                <IconSymbol name="circle.fill" size={4} color={colors.text} />
                <Text style={styles.bulletText}>
                  They can accept or decline the invitation from within the app
                </Text>
              </View>

              <View style={styles.bulletPoint}>
                <IconSymbol name="circle.fill" size={4} color={colors.text} />
                <Text style={styles.bulletText}>
                  Invitations expire after 7 days
                </Text>
              </View>

              <View style={styles.bulletPoint}>
                <IconSymbol name="circle.fill" size={4} color={colors.text} />
                <Text style={styles.bulletText}>
                  You can cancel pending invitations at any time
                </Text>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
