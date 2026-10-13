import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { useToast } from "@/hooks/useToast";
import { useDialog } from "@/lib/contexts/DialogContext";
import { AccountDeletionService } from "@/lib/services/accountDeletionService";
import { GroupService } from "@/lib/services/groupService";
import { supabase } from "@/services/supabaseClient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

const GRACE_DAYS = 30;
const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function DeleteAccountScreen() {
  const { theme } = useStyles();
  const { showError } = useToast();
  const { confirm, alert } = useDialog();
  const [typed, setTyped] = useState("");
  const [blocking, setBlocking] = useState<{ id: string; name: string }[]>([]);
  const [blockingStatus, setBlockingStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const loadBlocking = useCallback(async () => {
    const { data, error } = await GroupService.getOwnedGroupsWithMembers();
    // On error keep the last list. The server's 409 still guards deletion.
    if (error) {
      setBlockingStatus("error");
      return;
    }
    setBlocking(data ?? []);
    setBlockingStatus("ready");
  }, []);
  // Refocus (not just mount): the user may hand a group over and come back.
  useFocusEffect(
    useCallback(() => {
      void loadBlocking();
    }, [loadBlocking]),
  );

  const bold = {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  };
  const deletionDate = formatDate(new Date(Date.now() + GRACE_DAYS * 86400000));
  const checkingGroups = blockingStatus === "loading";
  const canDelete =
    typed === "DELETE" && blocking.length === 0 && !checkingGroups && !busy;

  const handleDelete = async () => {
    if (!canDelete || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const sure = await confirm({
        title: "Delete your account?",
        message: (
          <>
            Your account and data will be permanently deleted on{" "}
            <Text style={bold}>{deletionDate}</Text>. You&apos;ll be signed out
            on all devices. You can cancel by signing in before then.
          </>
        ),
        confirmText: "Delete account",
        cancelText: "Cancel",
        destructive: true,
      });
      if (!sure) return;
      const r = await AccountDeletionService.schedule();
      if (r.kind === "scheduled") {
        await alert({
          title: "Account scheduled for deletion",
          message: (
            <>
              {r.scheduledFor ? (
                <>
                  It will be deleted on{" "}
                  <Text style={bold}>
                    {formatDate(new Date(r.scheduledFor))}
                  </Text>
                  .
                </>
              ) : (
                "Your account will be deleted in 30 days."
              )}{" "}
              You&apos;ll be signed out now. Sign in before then if you change
              your mind.
            </>
          ),
          buttonText: "OK",
          variant: "success",
        });
        // The server kept this session alive ("others"), so a local sign-out
        // works; if it still fails, don't navigate into a signed-in app.
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) {
          showError("Couldn't sign you out", {
            message: "Close and reopen the app to finish signing out.",
          });
        } else {
          router.replace(Platform.OS === "web" ? "/" : "/(auth)/login");
        }
      } else if (r.kind === "reauth") {
        const ok = await confirm({
          title: "Sign in again",
          message: "For your security, sign in again to delete your account.",
          confirmText: "Sign in",
        });
        if (ok) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace("/(auth)/login?next=/account/delete");
        }
      } else if (r.kind === "blocked") {
        setBlocking(r.groups);
      } else {
        showError("Couldn't delete your account", { message: r.message });
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const text = {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    lineHeight: 24,
  };
  const heading = {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaxWidthContainer>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)/profile")
            }
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            <IconSymbol
              name="chevron.left"
              size={18}
              color={theme.colors.primary}
            />
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: theme.fontSize.base,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          <Text
            accessibilityRole="header"
            style={{ ...heading, fontSize: theme.fontSize.xl }}
          >
            Delete account
          </Text>

          <Text style={text}>
            Your account will be deleted on{" "}
            <Text style={bold}>{deletionDate}</Text>. Until then you can sign in
            and cancel.
          </Text>

          <Text style={heading}>What will be deleted</Text>
          <Text style={text}>
            {"•"} Your profile, vehicles and their fuel, mileage and service
            logs{"\n"}
            {"•"} Receipts and photos you uploaded{"\n"}
            {"•"} Groups you own with no other members, and your memberships
            {"\n"}
            {"•"} Notifications and notification settings
          </Text>

          <Text style={heading}>What stays</Text>
          <Text style={text}>
            Logs you added to family members&apos; vehicles stay on those
            vehicles without your name, with any receipt photos attached to
            them, so their history stays complete.
          </Text>

          {blocking.length > 0 && (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.colors.error,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                gap: theme.spacing.sm,
              }}
            >
              <Text style={heading}>Hand over your groups first</Text>
              <Text style={text}>
                You own groups that other people still use. Make another member
                the owner (the crown button) or delete the group, then come
                back.
              </Text>
              {blocking.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => router.push(`/groups/${g.id}` as never)}
                  accessibilityRole="link"
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: theme.fontSize.base,
                    }}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Input
            label={
              <>
                Type <Text style={bold}>DELETE</Text> to confirm
              </>
            }
            accessibilityLabel="Type DELETE to confirm"
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {checkingGroups && <Text style={text}>Checking your groups…</Text>}
          {blockingStatus === "error" && (
            <Text
              style={{
                color: theme.colors.error,
                fontSize: theme.fontSize.base,
              }}
            >
              Couldn&apos;t check your groups. Pull back and try again.
            </Text>
          )}

          <Button
            title="Delete my account"
            variant="danger"
            onPress={handleDelete}
            disabled={!canDelete}
            loading={busy}
            fullWidth
          />
        </ScrollView>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
