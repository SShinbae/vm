import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useStyles } from "react-native-unistyles";
import { GroupWithMembers, GroupInvitationWithDetails } from "@/types";
import { ThemedText as Text } from "@/components/ui/ThemedText";
import { Button } from "@/components/ui/Button";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { SkeletonGroupDetail } from "@/components/ui/Skeleton";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { formatDateWithPrefix } from "@/lib/utils/dateUtils";
import { GroupAvatar } from "./GroupAvatar";

type GroupTab = "members" | "vehicles" | "invitations";

export function GroupWebDetail({
  group,
  invitations,
  vehicles,
  userId,
  loading,
  refreshing,
  busy,
  activeTab,
  onTabChange,
  onBack,
  onRefresh,
  onRemoveMember,
  onMakeOwner,
  onResend,
  onCancel,
  onLeave,
  onDelete,
}: {
  group: GroupWithMembers | null;
  invitations: GroupInvitationWithDetails[];
  vehicles: any[];
  userId?: string;
  loading: boolean;
  refreshing: boolean;
  busy: boolean;
  activeTab: GroupTab;
  onTabChange: (tab: GroupTab) => void;
  onBack: () => void;
  onRefresh: () => void;
  onRemoveMember: (id: string, name: string) => void;
  onMakeOwner: (id: string, name: string) => void;
  onResend: (id: string, email: string) => void;
  onCancel: (id: string, email: string) => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const { theme } = useStyles();
  const { styles: web } = useStyles(webPageStyles);
  const isOwner = group?.owner_id === userId;
  const tabs: { id: GroupTab; label: string }[] = [
    { id: "members", label: `Members (${group?.member_count || 0})` },
    { id: "vehicles", label: `Vehicles (${vehicles.length})` },
    ...(isOwner
      ? [
          {
            id: "invitations" as const,
            label: `Invitations (${invitations.length})`,
          },
        ]
      : []),
  ];
  const visibleTab =
    activeTab === "invitations" && !isOwner ? "members" : activeTab;
  const row = {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  };
  const actions = {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.sm,
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View
        style={[
          web.frame,
          {
            flex: 0,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.lg,
          },
        ]}
      >
        <View style={actions}>
          <Button
            title="Back"
            variant="outline"
            size="small"
            onPress={onBack}
          />
        </View>
        {loading ? (
          <SkeletonGroupDetail />
        ) : !group ? (
          <View style={web.panel}>
            <Text weight="semibold">Group Not Found</Text>
            <Text color="secondary">
              This group does not exist or you don&apos;t have access.
            </Text>
          </View>
        ) : (
          <>
            <View style={[web.panel, { gap: theme.spacing.sm }]}>
              <Text size="xl" weight="bold">
                {group.name}
              </Text>
              {!!group.description && (
                <Text color="secondary">{group.description}</Text>
              )}
              <Text size="sm" color="secondary">
                {isOwner ? "Owner" : "Member"} · {group.member_count}{" "}
                {group.member_count === 1 ? "member" : "members"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing.md,
              }}
            >
              <View style={web.filters}>
                {tabs.map((tab) => (
                  <WebFilterButton
                    key={tab.id}
                    label={tab.label}
                    selected={visibleTab === tab.id}
                    onPress={() => onTabChange(tab.id)}
                  />
                ))}
              </View>
              <View style={actions}>
                <Button
                  title="Refresh"
                  variant="outline"
                  size="small"
                  loading={refreshing}
                  onPress={onRefresh}
                />
                {isOwner && (
                  <Button
                    title="Invite Member"
                    size="small"
                    onPress={() => router.push(`/groups/${group.id}/invite`)}
                  />
                )}
              </View>
            </View>
            <View style={web.panel}>
              {visibleTab === "members" && (
                <>
                  {!group.group_members?.length && (
                    <Text color="secondary">No members to display</Text>
                  )}
                  {group.group_members?.map((member) => {
                    const name =
                      member.profiles?.full_name ||
                      member.profiles?.email ||
                      "Member";
                    const memberIsOwner = member.user_id === group.owner_id;
                    return (
                      <View key={member.id} style={row}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: theme.spacing.md,
                            flex: 1,
                            minWidth: 220,
                          }}
                        >
                          <GroupAvatar
                            name={name}
                            avatarUrl={member.profiles?.avatar_url}
                          />
                          <View
                            style={{
                              flex: 1,
                              minWidth: 0,
                              gap: theme.spacing.xs,
                            }}
                          >
                            <Text weight="semibold">
                              {name}
                              {member.user_id === userId ? " (You)" : ""}
                            </Text>
                            <Text size="sm" color="secondary">
                              {member.profiles?.email}
                            </Text>
                            <Text size="xs" color="secondary">
                              {memberIsOwner ? "Owner" : "Member"}
                            </Text>
                          </View>
                        </View>
                        <View style={{ width: 160 }}>
                          <Text size="sm" color="secondary">
                            {formatDateWithPrefix(member.joined_at, "Joined")}
                          </Text>
                        </View>
                        {isOwner && (
                          <View style={[actions, { width: 220 }]}>
                            {!memberIsOwner && member.user_id !== userId && (
                              <>
                                <Button
                                  title="Make owner"
                                  size="small"
                                  variant="outline"
                                  disabled={busy}
                                  onPress={() =>
                                    onMakeOwner(member.user_id, name)
                                  }
                                />
                                <Button
                                  title="Remove"
                                  size="small"
                                  variant="danger"
                                  disabled={busy}
                                  onPress={() =>
                                    onRemoveMember(member.user_id, name)
                                  }
                                />
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
              {visibleTab === "vehicles" && (
                <>
                  {!vehicles.length && (
                    <>
                      <Text weight="semibold">No shared vehicles</Text>
                      <Text color="secondary">
                        Group members can enable sharing in their vehicle
                        settings.
                      </Text>
                    </>
                  )}
                  {vehicles.map((vehicle) => (
                    <View key={vehicle.id} style={row}>
                      <View
                        style={{
                          flex: 1,
                          minWidth: 220,
                          gap: theme.spacing.xs,
                        }}
                      >
                        <Text weight="semibold">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                        <Text size="sm" color="secondary">
                          {vehicle.license_plate}
                        </Text>
                        {vehicle.owner_profile && (
                          <Text size="sm" color="secondary">
                            Shared by{" "}
                            {vehicle.owner_profile.full_name ||
                              vehicle.owner_profile.email}
                          </Text>
                        )}
                      </View>
                      <Button
                        title="View vehicle"
                        size="small"
                        variant="outline"
                        onPress={() => router.push(`/vehicles/${vehicle.id}`)}
                      />
                    </View>
                  ))}
                </>
              )}
              {visibleTab === "invitations" && isOwner && (
                <>
                  {!invitations.length && (
                    <>
                      <Text weight="semibold">No invitations</Text>
                      <Text color="secondary">
                        Send invitations to add new members to this group.
                      </Text>
                    </>
                  )}
                  {invitations.map((invitation) => (
                    <View key={invitation.id} style={row}>
                      <View style={{ flex: 1, minWidth: 220 }}>
                        <Text weight="semibold">{invitation.email}</Text>
                      </View>
                      <View style={{ width: 90 }}>
                        <Text size="sm" color="secondary">
                          {invitation.status.charAt(0).toUpperCase() +
                            invitation.status.slice(1)}
                        </Text>
                      </View>
                      <View style={{ width: 160 }}>
                        <Text size="sm" color="secondary">
                          {formatDateWithPrefix(invitation.created_at, "Sent")}
                        </Text>
                      </View>
                      <View style={[actions, { width: 180 }]}>
                        <Button
                          title="Resend"
                          size="small"
                          variant="outline"
                          disabled={busy}
                          onPress={() =>
                            onResend(invitation.id, invitation.email)
                          }
                        />
                        <Button
                          title="Cancel"
                          size="small"
                          variant="outline"
                          disabled={busy}
                          onPress={() =>
                            onCancel(invitation.id, invitation.email)
                          }
                        />
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
            <View
              style={[
                web.panel,
                {
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: theme.spacing.md,
                },
              ]}
            >
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text weight="semibold">
                  {isOwner ? "Delete this group" : "Leave this group"}
                </Text>
                <Text size="sm" color="secondary">
                  {isOwner
                    ? "Removes the group and its sharing access."
                    : "You will lose access to vehicles shared with this group."}
                </Text>
              </View>
              <Button
                title={isOwner ? "Delete Group" : "Leave Group"}
                variant="danger"
                disabled={busy}
                onPress={isOwner ? onDelete : onLeave}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
