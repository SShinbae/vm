import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { withOpacity, spacing } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/hooks/useToast";
import { GroupService } from "@/lib/services/groupService";
import { GroupWithMembers } from "@/types";
import { router, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { Button } from "@/components/ui/Button";
import { GroupAvatar } from "@/components/groups/GroupAvatar";

export default function GroupsScreen() {
  const { theme } = useStyles();
  const { styles: web } = useStyles(webPageStyles);
  const layout = useResponsiveLayout();
  const isWeb = layout.isWeb && !layout.isMobile;
  const { user } = useAuth();
  const navigation = useRouter();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const focused = useRef(false);
  const requestId = useRef(0);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const fetchGroups = useCallback(async () => {
    if (!focused.current) return;
    const currentRequest = ++requestId.current;
    try {
      const result = await GroupService.getGroups();
      if (!focused.current || currentRequest !== requestId.current) return;
      if (result.error) {
        setLoadError(true);
        toast.error("Failed to load groups");
      } else {
        setGroups(result.data || []);
        setLoadError(false);
      }
    } catch {
      if (focused.current && currentRequest === requestId.current) {
        setLoadError(true);
        toast.error("Failed to load groups");
      }
    } finally {
      if (focused.current && currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
  }, [fetchGroups]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void fetchGroups();
      return () => {
        focused.current = false;
        requestId.current += 1;
      };
    }, [fetchGroups]),
  );

  const GroupCard = ({ group }: { group: GroupWithMembers }) => {
    const isOwner = group.owner_id === user?.id;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          marginBottom: isWeb ? 0 : theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${group.name}`}
        onPress={() => router.push(`/groups/${group.id}` as any)}
        activeOpacity={0.7}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  flexShrink: 1,
                }}
              >
                {group.name}
              </Text>
              {
                <View
                  style={{
                    backgroundColor: withOpacity(theme.colors.primary, 0.12),
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.primary,
                      textTransform: "uppercase",
                    }}
                  >
                    {isOwner ? "Owner" : "Member"}
                  </Text>
                </View>
              }
            </View>
            {group.description && (
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm,
                }}
                numberOfLines={2}
              >
                {group.description}
              </Text>
            )}
          </View>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            <IconSymbol
              name="person.2"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}
            >
              {group.member_count}{" "}
              {group.member_count === 1 ? "member" : "members"}
            </Text>
          </View>

          {/* Member Avatars */}
          {group.group_members && group.group_members.length > 0 && (
            <View style={{ flexDirection: "row", marginLeft: "auto" }}>
              {group.group_members.slice(0, 3).map((member, index) => (
                <View
                  key={member.id}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: withOpacity(theme.colors.primary, 0.19),
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                    marginLeft: index > 0 ? -8 : 0,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <GroupAvatar
                    name={
                      member.profiles?.full_name ||
                      member.profiles?.email ||
                      "Member"
                    }
                    avatarUrl={member.profiles?.avatar_url}
                    size={28}
                  />
                </View>
              ))}
              {(group.member_count || 0) > 3 && (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 2,
                    borderColor: theme.colors.border,
                    marginLeft: -spacing.sm,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    +{(group.member_count || 0) - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isWeb) {
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
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: theme.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontWeight: "600",
                color: theme.colors.text,
              }}
            >
              All groups{!loading ? ` (${groups.length})` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <Button
                title="Refresh"
                size="small"
                variant="outline"
                loading={refreshing}
                onPress={onRefresh}
              />
              <Button
                title="Create Group"
                size="small"
                icon="plus"
                onPress={() => router.push("/groups/create")}
              />
            </View>
          </View>
          {loading ? (
            <SkeletonList itemCount={3} showAvatar lines={3} />
          ) : groups.length === 0 ? (
            <View style={[web.panel, { gap: theme.spacing.sm }]}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontWeight: "600",
                  fontSize: theme.fontSize.lg,
                }}
              >
                No Groups Yet
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>
                Create a group to share vehicles with family, friends, or team
                members.
              </Text>
            </View>
          ) : (
            <ResponsiveGrid
              columns={{ tablet: 1, desktop: 2, largeDesktop: 3 }}
            >
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </ResponsiveGrid>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <MobilePageHeader
          title="Groups"
          subtitle="Share vehicles with family, friends, or your team"
          onBack={handleBack}
        />
        <Button
          title="Create Group"
          icon="plus"
          onPress={() => router.push("/groups/create")}
          fullWidth
          style={{ minHeight: 48, marginBottom: 16 }}
        />
        {loadError && (
          <View style={{ gap: 12, marginBottom: 16 }}>
            <Text
              accessibilityRole="alert"
              style={{ color: theme.colors.text }}
            >
              Couldn&apos;t load groups. Please try again.
            </Text>
            <Button
              title="Retry groups"
              variant="outline"
              disabled={refreshing}
              onPress={() => {
                void onRefresh();
              }}
              style={{ minHeight: 48 }}
            />
          </View>
        )}
        {loading ? (
          <SkeletonList itemCount={4} showAvatar lines={3} />
        ) : groups.length > 0 ? (
          groups.map((group) => <GroupCard key={group.id} group={group} />)
        ) : (
          !loadError && (
            <View style={{ gap: 12, paddingVertical: 32 }}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fontSize.xl,
                  fontWeight: "600",
                }}
              >
                No Groups Yet
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>
                Create a group to share vehicles with family, friends, or team
                members.
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
