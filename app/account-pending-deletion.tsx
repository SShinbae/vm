import { Button } from "@/components/ui/Button";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { AccountDeletionService } from "@/lib/services/accountDeletionService";
import { pushService } from "@/lib/services/pushService";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

export default function AccountPendingDeletionScreen() {
  const { theme } = useStyles();
  const { user, signOut, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const when = user?.profile?.deletion_scheduled_at
    ? new Date(user.profile.deletion_scheduled_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const handleCancel = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await AccountDeletionService.cancel();
      if (r.kind === "cancelled" || r.kind === "not_pending") {
        showSuccess("Deletion cancelled", {
          message: "Your account will not be deleted.",
        });
        try {
          await refreshProfile(); // else the guard sends us straight back here
          // Scheduling deleted our push tokens and sign-in sync was a no-op
          // while pending; user.id is unchanged so nothing else re-registers.
          void pushService.syncUser();
          router.replace("/(tabs)");
        } catch {
          // Navigating now would just bounce back (profile still says pending).
          showError("Couldn't refresh your account", {
            message: "Tap Cancel deletion again, or reopen the app.",
          });
        }
      } else if (r.kind === "in_progress") {
        showError("Your account is being deleted", {
          message:
            "The deletion date has passed and it can no longer be cancelled.",
        });
      } else {
        showError("Couldn't cancel deletion", { message: r.message });
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) showError("Couldn't sign out", { message: error });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaxWidthContainer>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.text,
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
            }}
          >
            Your account is scheduled for deletion
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.base,
              lineHeight: 24,
            }}
          >
            {when
              ? `It will be permanently deleted on ${when}. Cancel to keep your account and everything in it.`
              : "Cancel to keep your account and everything in it."}
          </Text>
          <Button
            title="Cancel deletion"
            variant="primary"
            onPress={handleCancel}
            loading={busy}
            disabled={busy}
            fullWidth
          />
          <Button
            title="Sign out"
            variant="outline"
            onPress={handleSignOut}
            disabled={busy}
            fullWidth
          />
        </View>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
