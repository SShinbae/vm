import { storageImageUrl } from "@/lib/utils/storagePath";
import { withOpacity, spacing } from "@/src/design-system";
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  GroupService,
  GroupInvitationService,
} from "@/lib/services/groupService";
import { VehicleService } from "@/lib/services/vehicleService";
import { GroupWithMembers, GroupInvitationWithDetails } from "@/types";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SkeletonGroupDetail } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import { toast } from "@/hooks/useToast";
import { usePostHog } from "posthog-react-native";
import { formatDateWithPrefix } from "@/lib/utils/dateUtils";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { Button } from "@/components/ui/Button";
import { GroupAvatar } from "@/components/groups/GroupAvatar";
import { ThemedText as Text } from "@/components/ui/ThemedText";
import { useStyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { GroupWebDetail } from "@/components/groups/GroupWebDetail";

type TabType = "members" | "invitations" | "vehicles";

export default function GroupDetailScreen() {
  const { theme } = useStyles();
  const layout = useResponsiveLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, fontScale } = useWindowDimensions();
  const stackActions = width < 360 || fontScale >= 1.3;
  const isWebPage = layout.isWeb && !layout.isMobile;
  const navigation = useRouter();

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/groups");
    }
  }, [navigation]);

  const { user } = useAuth();
  const dialog = useDialog();
  const posthog = usePostHog();
  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitationWithDetails[]>(
    [],
  );
  const [sharedVehicles, setSharedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const focused = useRef(false);
  const requestId = useRef(0);

  const fetchGroupData = useCallback(async () => {
    if (!id || !focused.current) return;
    const currentRequest = ++requestId.current;
    try {
      const [groupResult, invitationsResult, vehiclesResult] =
        await Promise.all([
          GroupService.getGroupById(id),
          GroupInvitationService.getInvitations(id),
          VehicleService.getVehiclesForGroup(id),
        ]);
      if (!focused.current || currentRequest !== requestId.current) return;

      setLoadError(
        !!(
          groupResult.error ||
          invitationsResult.error ||
          vehiclesResult.error
        ),
      );
      if (groupResult.error) {
        toast.error("Failed to load group details");
        if (isWebPage) handleGoBack();
      } else if (groupResult.data) {
        setGroup(groupResult.data);
      }

      if (invitationsResult.data) setInvitations(invitationsResult.data);
      if (vehiclesResult.data) setSharedVehicles(vehiclesResult.data);
    } catch {
      if (focused.current && currentRequest === requestId.current) {
        setLoadError(true);
        toast.error("Failed to load group details");
      }
    } finally {
      if (focused.current && currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [id, handleGoBack, isWebPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroupData();
  }, [fetchGroupData]);

  // Dialogs close on confirm, so guard against double taps while the action runs.
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const runExclusive = async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
    } catch {
      toast.error("Couldn't update group. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group) return;

    const ok = await dialog.confirm({
      title: "Remove Member",
      message: `Are you sure you want to remove ${memberName} from this group?`,
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;

    await runExclusive(async () => {
      const { error } = await GroupService.removeMember(group.id, memberId);
      if (error) {
        toast.error("Couldn't remove member", { message: error });
      } else {
        posthog?.capture("group_member_removed");
        await fetchGroupData();
        toast.success("Member removed");
      }
    });
  };

  const handleMakeOwner = async (memberId: string, memberName: string) => {
    if (!group) return;

    const ok = await dialog.confirm({
      title: "Make owner?",
      message: `${memberName} will become the owner of ${group.name}. You'll stay in the group as a member and can no longer manage it.`,
      confirmText: "Make owner",
    });
    if (!ok) return;

    await runExclusive(async () => {
      const { error } = await GroupService.transferOwnership(
        group.id,
        memberId,
      );
      if (error) {
        toast.error("Couldn't transfer ownership", { message: error });
      } else {
        posthog?.capture("group_ownership_transferred");
        await fetchGroupData();
        toast.success(`${memberName} is now the owner`);
      }
    });
  };

  const handleCancelInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    const ok = await dialog.confirm({
      title: "Cancel Invitation",
      message: `Are you sure you want to cancel the invitation to ${email}?`,
      confirmText: "Cancel Invitation",
      cancelText: "Keep",
      destructive: true,
    });
    if (!ok) return;

    await runExclusive(async () => {
      const { error } =
        await GroupInvitationService.cancelInvitation(invitationId);
      if (error) {
        toast.error("Couldn't cancel invitation", { message: error });
      } else {
        posthog?.capture("group_invitation_cancelled");
        await fetchGroupData();
        toast.success("Invitation cancelled");
      }
    });
  };

  const handleResendInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    await runExclusive(async () => {
      const { error } =
        await GroupInvitationService.resendInvitation(invitationId);
      if (error) {
        toast.error("Couldn't resend invitation", { message: error });
      } else {
        posthog?.capture("group_invitation_resent");
        await fetchGroupData();
        toast.success(`Invitation resent to ${email}`);
      }
    });
  };

  const handleLeaveGroup = async () => {
    if (!group) return;

    const ok = await dialog.confirm({
      title: "Leave Group",
      message: `Are you sure you want to leave "${group.name}"? You will no longer have access to shared vehicles and group information.`,
      confirmText: "Leave Group",
      destructive: true,
    });
    if (!ok) return;

    await runExclusive(async () => {
      const { error } = await GroupService.leaveGroup(group.id);
      if (error) {
        toast.error("Couldn't leave group", { message: error });
      } else {
        posthog?.capture("group_left");
        toast.success("You have left the group");
        handleGoBack();
      }
    });
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    const ok = await dialog.confirm({
      title: "Delete Group",
      message: `Are you sure you want to delete "${group.name}"? This action cannot be undone. All members will be removed and shared vehicle access will be revoked.`,
      confirmText: "Delete Group",
      destructive: true,
    });
    if (!ok) return;

    await runExclusive(async () => {
      const { error } = await GroupService.deleteGroup(group.id);
      if (error) {
        toast.error("Couldn't delete group", { message: error });
      } else {
        posthog?.capture("group_deleted");
        toast.success("Group deleted");
        handleGoBack();
      }
    });
  };

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void fetchGroupData();
      return () => {
        focused.current = false;
        requestId.current += 1;
      };
    }, [fetchGroupData]),
  );

  if (isWebPage) {
    return (
      <GroupWebDetail
        group={group}
        invitations={invitations}
        vehicles={sharedVehicles}
        userId={user?.id}
        loading={loading}
        refreshing={refreshing}
        busy={busy}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={handleGoBack}
        onRefresh={onRefresh}
        onRemoveMember={handleRemoveMember}
        onMakeOwner={handleMakeOwner}
        onResend={handleResendInvitation}
        onCancel={handleCancelInvitation}
        onLeave={handleLeaveGroup}
        onDelete={handleDeleteGroup}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <MobilePageHeader
            title="Group details"
            subtitle="Loading group…"
            onBack={handleGoBack}
          />
        </View>
        <SkeletonGroupDetail />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <MobilePageHeader
            title={loadError ? "Group details" : "Group Not Found"}
            onBack={handleGoBack}
          />
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.lg,
          }}
        >
          <Text>
            {loadError
              ? "Couldn't load group details. Please try again."
              : "This group does not exist or you don't have access."}
          </Text>
          {loadError && (
            <Button
              title="Retry group details"
              variant="outline"
              disabled={refreshing}
              onPress={() => {
                void onRefresh();
              }}
              style={{ minHeight: 48, marginTop: 16 }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = group.owner_id === user?.id;
  const visibleTab =
    !isOwner && activeTab === "invitations" ? "members" : activeTab;

  const MemberCard = ({ member }: { member: any }) => {
    const isMemberOwner = member.user_id === group.owner_id;
    const isCurrentUser = member.user_id === user?.id;

    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.spacing.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            rowGap: 12,
          }}
        >
          <View style={{ marginRight: 12 }}>
            <GroupAvatar
              name={
                member.profiles?.full_name || member.profiles?.email || "Member"
              }
              avatarUrl={member.profiles?.avatar_url}
              size={40}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.xs,
                gap: spacing.sm,
              }}
            >
              <Text weight="semibold" style={{ flexShrink: 1 }}>
                {member.profiles?.full_name || member.profiles?.email}
                {isCurrentUser && " (You)"}
              </Text>
              {isMemberOwner && (
                <View
                  style={{
                    backgroundColor: withOpacity(theme.colors.primary, 0.12),
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: 4,
                  }}
                >
                  <Text size="xs" color="primary" weight="semibold">
                    OWNER
                  </Text>
                </View>
              )}
            </View>
            <Text size="sm" color="secondary">
              {member.profiles?.email}
            </Text>
            <Text size="xs" color="secondary">
              {formatDateWithPrefix(member.joined_at, "Joined")}
            </Text>
          </View>
          {!isMemberOwner && !isCurrentUser && isOwner && (
            <View
              style={{
                flexDirection: "row",
                flexBasis: stackActions ? "100%" : undefined,
                justifyContent: "flex-end",
              }}
            >
              <TouchableOpacity
                disabled={busy}
                accessibilityState={{ disabled: busy }}
                style={{
                  padding: spacing.sm,
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel={`Make ${member.profiles?.full_name || member.profiles?.email} the owner`}
                onPress={() =>
                  handleMakeOwner(
                    member.user_id,
                    member.profiles?.full_name || member.profiles?.email,
                  )
                }
              >
                <IconSymbol
                  name="crown"
                  size={16}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                accessibilityState={{ disabled: busy }}
                style={{
                  padding: spacing.sm,
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${member.profiles?.full_name || member.profiles?.email}`}
                onPress={() =>
                  handleRemoveMember(
                    member.user_id,
                    member.profiles?.full_name || member.profiles?.email,
                  )
                }
              >
                <IconSymbol name="trash" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const InvitationCard = ({
    invitation,
  }: {
    invitation: GroupInvitationWithDetails;
  }) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.spacing.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-start",
          rowGap: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: withOpacity(theme.colors.primary, 0.12),
            alignItems: "center",
            justifyContent: "center",
            marginRight: theme.spacing.sm,
          }}
        >
          <IconSymbol
            name="envelope.fill"
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="semibold">{invitation.email}</Text>
          <Text size="sm" color="secondary">
            Status:{" "}
            {invitation.status.charAt(0).toUpperCase() +
              invitation.status.slice(1)}
          </Text>
          <Text size="xs" color="secondary">
            {formatDateWithPrefix(invitation.created_at, "Sent")}
          </Text>
        </View>
        {isOwner && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexBasis: stackActions ? "100%" : undefined,
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              style={{
                padding: spacing.sm,
                minWidth: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() =>
                handleResendInvitation(invitation.id, invitation.email)
              }
              accessibilityRole="button"
              accessibilityLabel={`Resend invitation to ${invitation.email}`}
            >
              <IconSymbol
                name="paperplane.fill"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              style={{
                padding: spacing.sm,
                minWidth: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() =>
                handleCancelInvitation(invitation.id, invitation.email)
              }
              accessibilityRole="button"
              accessibilityLabel={`Cancel invitation to ${invitation.email}`}
            >
              <IconSymbol name="xmark" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const VehicleCard = ({ vehicle }: { vehicle: any }) => (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.spacing.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {vehicle.main_image_url ? (
          <Image
            source={{
              uri: storageImageUrl("vehicle-images", vehicle.main_image_url),
            }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              marginRight: theme.spacing.sm,
            }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: withOpacity(theme.colors.primary, 0.12),
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.sm,
            }}
          >
            <IconSymbol
              name="car.fill"
              size={24}
              color={theme.colors.primary}
            />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text size="sm" color="secondary">
            {vehicle.license_plate}
          </Text>
          {vehicle.owner_profile && (
            <Text size="xs" color="secondary">
              Shared by{" "}
              {vehicle.owner_profile.full_name || vehicle.owner_profile.email}
            </Text>
          )}
        </View>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={theme.colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (visibleTab === "members") {
      return (
        <>
          {group.group_members?.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </>
      );
    }

    if (visibleTab === "vehicles") {
      if (sharedVehicles.length === 0) {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: theme.spacing.xl,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <IconSymbol
                name="car"
                size={24}
                color={theme.colors.textSecondary}
              />
            </View>
            <Text weight="semibold" style={{ marginBottom: theme.spacing.xs }}>
              No shared vehicles
            </Text>
            <Text
              size="sm"
              color="secondary"
              style={{ textAlign: "center", maxWidth: 300 }}
            >
              Group members can share their vehicles here. Enable sharing in
              your vehicle settings.
            </Text>
          </View>
        );
      }

      return (
        <>
          {sharedVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </>
      );
    }

    // Invitations tab
    if (invitations.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.xl,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <IconSymbol
              name="envelope"
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
          <Text weight="semibold" style={{ marginBottom: theme.spacing.xs }}>
            No invitations
          </Text>
          <Text size="sm" color="secondary">
            Send invitations to add new members to this group
          </Text>
        </View>
      );
    }

    return (
      <>
        {invitations.map((invitation) => (
          <InvitationCard key={invitation.id} invitation={invitation} />
        ))}
      </>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <MobilePageHeader
          title={group.name}
          subtitle={group.description || undefined}
          onBack={handleGoBack}
          action={
            isOwner ? (
              <Button
                title="Invite Members"
                icon="person.badge.plus"
                disabled={busy}
                onPress={() => router.push(`/groups/${group.id}/invite`)}
                style={{ minHeight: 48 }}
              />
            ) : undefined
          }
        />
        {loadError && (
          <View style={{ gap: 12, marginBottom: 16 }}>
            <Text>Some group details couldn&apos;t load. Please retry.</Text>
            <Button
              title="Retry group details"
              variant="outline"
              disabled={refreshing}
              onPress={() => {
                void onRefresh();
              }}
              style={{ minHeight: 48 }}
            />
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            { key: "members", label: `Members (${group.member_count})` },
            { key: "vehicles", label: `Vehicles (${sharedVehicles.length})` },
            ...(isOwner
              ? [
                  {
                    key: "invitations",
                    label: `Invites (${invitations.length})`,
                  },
                ]
              : []),
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: visibleTab === tab.key }}
              onPress={() => setActiveTab(tab.key as TabType)}
              style={{
                flexGrow: 1,
                flexBasis: stackActions ? "100%" : "28%",
                minWidth: 0,
                minHeight: 48,
                padding: 12,
                borderRadius: theme.borderRadius.md,
                backgroundColor:
                  visibleTab === tab.key
                    ? theme.colors.primary
                    : theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                weight="semibold"
                style={{
                  color:
                    visibleTab === tab.key
                      ? theme.colors.white
                      : theme.colors.text,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Tab Content */}
        {renderTabContent()}

        {/* Leave Group Button (for non-owners) */}
        {!isOwner && (
          <View
            style={{
              padding: theme.spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <TouchableOpacity
              style={{
                minHeight: 48,
                justifyContent: "center",
                backgroundColor: withOpacity(theme.colors.error, 0.06),
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.error,
                alignItems: "center",
              }}
              onPress={handleLeaveGroup}
              accessibilityRole="button"
              accessibilityLabel="Leave Group"
              disabled={busy}
            >
              <Text color="error" weight="semibold">
                Leave Group
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Group Button (for owners) */}
        {isOwner && (
          <View
            style={{
              padding: theme.spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <TouchableOpacity
              style={{
                minHeight: 48,
                justifyContent: "center",
                backgroundColor: withOpacity(theme.colors.error, 0.06),
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.error,
                alignItems: "center",
                flexDirection: "row",
                gap: theme.spacing.sm,
              }}
              onPress={handleDeleteGroup}
              accessibilityRole="button"
              accessibilityLabel="Delete Group"
              disabled={busy}
            >
              <IconSymbol name="trash" size={16} color={theme.colors.error} />
              <Text color="error" weight="semibold">
                Delete Group
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
