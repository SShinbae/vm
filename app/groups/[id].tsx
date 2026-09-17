import { withOpacity, spacing } from "@/src/design-system";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useRouter } from "expo-router";
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
import { usePostHog } from "posthog-react-native";
import { formatDateWithPrefix } from "@/lib/utils/dateUtils";
import { PageHeader } from "@/components/ui/PageHeader";
import { ThemedText as Text } from "@/components/ui/ThemedText";
import { useStyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "members" | "invitations" | "vehicles";

export default function GroupDetailScreen() {
  const { theme } = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const navigation = useRouter();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/groups");
    }
  };

  // Clamp font size: min 10, preferred based on width, max 14
  const tabFontSize = Math.min(Math.max(width * 0.03, 10), 14);
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

  const fetchGroupData = useCallback(async () => {
    if (!id) return;

    const [groupResult, invitationsResult, vehiclesResult] = await Promise.all([
      GroupService.getGroupById(id),
      GroupInvitationService.getInvitations(id),
      VehicleService.getVehiclesForGroup(id),
    ]);

    if (groupResult.error) {
      dialog.showError("Error", "Failed to load group details");
      handleGoBack();
    } else if (groupResult.data) {
      setGroup(groupResult.data);
    }

    if (invitationsResult.data) {
      setInvitations(invitationsResult.data);
    }

    if (vehiclesResult.data) {
      setSharedVehicles(vehiclesResult.data);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dialog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  }, [fetchGroupData]);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group) return;

    dialog.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await GroupService.removeMember(
              group.id,
              memberId,
            );
            if (error) {
              dialog.showError("Error", error);
            } else {
              posthog?.capture("group_member_removed");
              await fetchGroupData();
              dialog.showSuccess("Success", "Member removed successfully");
            }
            dialog.hideConfirm();
          },
        },
      ],
    );
  };

  const handleCancelInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    dialog.alert(
      "Cancel Invitation",
      `Are you sure you want to cancel the invitation to ${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Cancel Invitation",
          style: "destructive",
          onPress: async () => {
            const { error } =
              await GroupInvitationService.cancelInvitation(invitationId);
            if (error) {
              dialog.showError("Error", error);
            } else {
              posthog?.capture("group_invitation_cancelled");
              await fetchGroupData();
              dialog.showSuccess("Success", "Invitation cancelled");
            }
            dialog.hideConfirm();
          },
        },
      ],
    );
  };

  const handleResendInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    const { error } =
      await GroupInvitationService.resendInvitation(invitationId);
    if (error) {
      dialog.showError("Error", error);
    } else {
      posthog?.capture("group_invitation_resent");
      await fetchGroupData();
      dialog.showSuccess("Success", `Invitation resent to ${email}`);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;

    dialog.alert(
      "Leave Group",
      `Are you sure you want to leave "${group.name}"? You will no longer have access to shared vehicles and group information.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave Group",
          style: "destructive",
          onPress: async () => {
            const { error } = await GroupService.leaveGroup(group.id);
            if (error) {
              dialog.showError("Error", error);
            } else {
              posthog?.capture("group_left");
              dialog.showSuccess("Success", "You have left the group", () =>
                handleGoBack(),
              );
            }
            dialog.hideConfirm();
          },
        },
      ],
    );
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    dialog.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This action cannot be undone. All members will be removed and shared vehicle access will be revoked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Group",
          style: "destructive",
          onPress: async () => {
            const { error } = await GroupService.deleteGroup(group.id);
            if (error) {
              dialog.showError("Error", error);
            } else {
              posthog?.capture("group_deleted");
              dialog.showSuccess("Success", "Group deleted successfully", () =>
                handleGoBack(),
              );
            }
            dialog.hideConfirm();
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <PageHeader title="Loading..." showBack />
        <SkeletonGroupDetail />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <PageHeader title="Group Not Found" showBack />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.lg,
          }}
        >
          <Text>This group does not exist or you don&apos;t have access.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = group.owner_id === user?.id;

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
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {member.profiles?.avatar_url ? (
            <Image
              source={{ uri: member.profiles.avatar_url }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginRight: theme.spacing.sm,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: withOpacity(theme.colors.primary, 0.12),
                alignItems: "center",
                justifyContent: "center",
                marginRight: theme.spacing.sm,
              }}
            >
              <IconSymbol
                name="person.fill"
                size={20}
                color={theme.colors.primary}
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.xs,
                gap: spacing.sm,
              }}
            >
              <Text weight="semibold">
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
            <TouchableOpacity
              style={{ padding: spacing.sm }}
              onPress={() =>
                handleRemoveMember(
                  member.user_id,
                  member.profiles?.full_name || member.profiles?.email,
                )
              }
            >
              <IconSymbol name="trash" size={16} color={theme.colors.error} />
            </TouchableOpacity>
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
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
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
        <View style={{ flex: 1 }}>
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{ padding: spacing.sm }}
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
              style={{ padding: spacing.sm }}
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
      onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {vehicle.main_image_url ? (
          <Image
            source={{ uri: vehicle.main_image_url }}
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
        <View style={{ flex: 1 }}>
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
    if (activeTab === "members") {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.md }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {group.group_members?.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </ScrollView>
      );
    }

    if (activeTab === "vehicles") {
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.md }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {sharedVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </ScrollView>
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {invitations.map((invitation) => (
          <InvitationCard key={invitation.id} invitation={invitation} />
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PageHeader
        title={group.name}
        subtitle={group.description ?? undefined}
        showBack
        rightContent={
          isOwner ? (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.spacing.sm,
                gap: theme.spacing.xs,
              }}
              onPress={() => router.push(`/groups/${group.id}/invite` as any)}
            >
              <IconSymbol name="person.badge.plus" size={16} color="white" />
              <Text size="sm" weight="semibold" style={{ color: "white" }}>
                Invite Members
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          padding: theme.spacing.sm,
          gap: theme.spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.spacing.sm,
            backgroundColor:
              activeTab === "members" ? theme.colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setActiveTab("members")}
        >
          <Text
            weight="semibold"
            numberOfLines={1}
            style={{
              color: activeTab === "members" ? "white" : theme.colors.text,
              fontSize: tabFontSize,
            }}
          >
            Members({group.member_count})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.spacing.sm,
            backgroundColor:
              activeTab === "vehicles" ? theme.colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setActiveTab("vehicles")}
        >
          <Text
            weight="semibold"
            numberOfLines={1}
            style={{
              color: activeTab === "vehicles" ? "white" : theme.colors.text,
              fontSize: tabFontSize,
            }}
          >
            Vehicles({sharedVehicles.length})
          </Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.sm,
              borderRadius: theme.spacing.sm,
              backgroundColor:
                activeTab === "invitations"
                  ? theme.colors.primary
                  : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setActiveTab("invitations")}
          >
            <Text
              weight="semibold"
              numberOfLines={1}
              style={{
                color:
                  activeTab === "invitations" ? "white" : theme.colors.text,
                fontSize: tabFontSize,
              }}
            >
              Invites({invitations.length})
            </Text>
          </TouchableOpacity>
        )}
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
              backgroundColor: withOpacity(theme.colors.error, 0.06),
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.error,
              alignItems: "center",
            }}
            onPress={handleLeaveGroup}
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
              backgroundColor: withOpacity(theme.colors.error, 0.06),
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.error,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: theme.spacing.sm,
            }}
            onPress={handleDeleteGroup}
          >
            <IconSymbol name="trash" size={16} color={theme.colors.error} />
            <Text color="error" weight="semibold">
              Delete Group
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
