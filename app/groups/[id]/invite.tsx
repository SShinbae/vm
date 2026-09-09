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
import { AlertModal, ConfirmModal } from "@/components/ui/Modal";

export default function InviteToGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSendAnotherConfirm, setShowSendAnotherConfirm] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState("");
  const posthog = usePostHog();
  const { theme } = useStyles();
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
      setErrorMessage("Please enter an email address");
      setShowErrorModal(true);
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMessage("Please enter a valid email address");
      setShowErrorModal(true);
      return;
    }

    if (!id) {
      setErrorMessage("Group not found");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    const { error } = await GroupInvitationService.sendInvitation(
      id,
      email.trim(),
    );
    setLoading(false);

    if (error) {
      setErrorMessage(error);
      setShowErrorModal(true);
    } else {
      posthog?.capture("group_invitation_sent");
      setLastSentEmail(email.trim());
      setShowSendAnotherConfirm(true);
    }
  };

  const handleSendAnother = () => {
    setShowSendAnotherConfirm(false);
    setEmail("");
  };

  const handleDone = () => {
    setShowSendAnotherConfirm(false);
    handleGoBack();
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
                  The person will receive an email invitation (note: email
                  functionality is pending implementation)
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

      <ConfirmModal
        visible={showSendAnotherConfirm}
        onClose={handleDone}
        onConfirm={handleSendAnother}
        title="Invitation Sent"
        message={`An invitation has been sent to ${lastSentEmail}`}
        confirmText="Send Another"
        cancelText="Done"
      />

      <AlertModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        variant="error"
      />
    </SafeAreaView>
  );
}
