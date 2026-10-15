import { storageImageUrl } from "@/lib/utils/storagePath";
import { withOpacity, spacing } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/hooks/useToast";
import { GroupService } from "@/lib/services/groupService";
import { GroupWithMembers } from "@/types";
import { Image } from "expo-image";
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
        toast.error("Failed to load groups");
      } else {
        setGroups(result.data || []);
      }
    } catch {
      if (focused.current && currentRequest === requestId.current) {
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
              {(isOwner || isWeb) && (
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
              )}
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
                  {isWeb ? (
                    <GroupAvatar
                      size={28}
                      name={
                        member.profiles?.full_name ||
                        member.profiles?.email ||
                        "Member"
                      }
                      avatarUrl={member.profiles?.avatar_url}
                    />
                  ) : member.profiles?.avatar_url ? (
                    <Image
                      source={{
                        uri: storageImageUrl(
                          "profile-avatars",
                          member.profiles.avatar_url,
                        ),
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 14,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.fontWeight.semibold,
                        color: theme.colors.primary,
                      }}
                    >
                      {member.profiles?.full_name?.[0] ||
                        member.profiles?.email?.[0] ||
                        "?"}
                    </Text>
                  )}
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

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol
              name="chevron.left"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            Groups
          </Text>
        </View>
        <SkeletonList itemCount={4} showAvatar lines={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol
              name="chevron.left"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            Groups
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
          }}
          onPress={() => router.push("/groups/create" as any)}
        >
          <IconSymbol name="plus" size={16} color="white" />
          <Text
            style={{
              color: "white",
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
            }}
          >
            Create Group
          </Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
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
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <IconSymbol
              name="person.3"
              size={40}
              color={theme.colors.textSecondary}
            />
          </View>
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
            }}
          >
            No Groups Yet
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
              textAlign: "center",
              marginBottom: theme.spacing.xl,
            }}
          >
            Create a group to share vehicles with family, friends, or team
            members
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
            }}
            onPress={() => router.push("/groups/create" as any)}
          >
            <IconSymbol name="plus" size={20} color="white" />
            <Text
              style={{
                color: "white",
                fontSize: theme.fontSize.base,
                fontWeight: theme.fontWeight.semibold,
              }}
            >
              Create Your First Group
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
