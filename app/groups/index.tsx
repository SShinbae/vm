import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import { GroupService } from "@/lib/services/groupService";
import { GroupWithMembers } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

export default function GroupsScreen() {
  const { theme } = useStyles();
  const { user } = useAuth();
  const dialog = useDialog();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    const result = await GroupService.getGroups();
    if (result.error) {
      dialog.showError("Error", "Failed to load groups");
    } else {
      setGroups(result.data || []);
    }
    setLoading(false);
  }, [dialog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }, [fetchGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const GroupCard = ({ group }: { group: GroupWithMembers }) => {
    const isOwner = group.owner_id === user?.id;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
        onPress={() => router.push(`/groups/${group.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                }}
              >
                {group.name}
              </Text>
              {isOwner && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary + "20",
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
                    Owner
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
            <IconSymbol name="person.2" size={16} color={theme.colors.textSecondary} />
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}
            >
              {group.member_count} {group.member_count === 1 ? "member" : "members"}
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
                    backgroundColor: theme.colors.primary + "30",
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                    marginLeft: index > 0 ? -8 : 0,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {member.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: member.profiles.avatar_url }}
                      style={{ width: "100%", height: "100%", borderRadius: 14 }}
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
                      {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || "?"}
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
                    marginLeft: -8,
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
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
        <Text
          style={{
            fontSize: theme.fontSize["3xl"],
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
          }}
        >
          Groups
        </Text>
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
            <IconSymbol name="person.3" size={40} color={theme.colors.textSecondary} />
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
            Create a group to share vehicles with family, friends, or team members
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
