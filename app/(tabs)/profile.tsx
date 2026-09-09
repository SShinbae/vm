import { withOpacity } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Modal } from "@/components/ui/Modal";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

type TabName = "Profile" | "Settings";

export default function ProfileScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { showConfirm, hideConfirm } = useDialog();
  const { theme } = useStyles();
  const { isMobile, isWeb } = useResponsiveLayout();
  const { stats, loading: statsLoading } = useProfileStats();

  const [fullName, setFullName] = useState(user?.profile?.full_name || "");
  const [username, setUsername] = useState(user?.profile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("Profile");

  // Deeplink support: `/profile?tab=Settings` opens directly to the Settings tab
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  useEffect(() => {
    if (tabParam === "Settings" || tabParam === "Profile") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setAvatarUrl(user?.profile?.avatar_url || null);
  }, [user?.profile?.avatar_url]);

  const handleEditPress = () => {
    if (isWeb && !isMobile) {
      setIsEditing(true);
      setActiveTab("Settings");
    } else {
      setShowEditModal(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFullName(user?.profile?.full_name || "");
    setUsername(user?.profile?.username || "");
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const success = await updateProfile({ full_name: fullName, username });
    setLoading(false);

    if (success) {
      setIsEditing(false);
      setShowEditModal(false);
      Alert.alert("Success", "Profile updated successfully");
    }
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
  };

  const handleAvatarError = (error: string) => {
    Alert.alert("Upload Error", error);
  };

  const handleSignOut = () => {
    showConfirm("Sign Out", "Are you sure you want to sign out?", async () => {
      await signOut();
      hideConfirm();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/login");
      }
    });
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  // Tab button component
  const TabButton = ({ tab }: { tab: TabName }) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: isActive ? theme.colors.primary : "transparent",
          alignItems: "center",
        }}
        onPress={() => setActiveTab(tab)}
        accessibilityRole="tab"
        accessibilityLabel={`${tab} tab`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={{
            color: isActive ? theme.colors.white : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: isActive
              ? theme.fontWeight.semibold
              : theme.fontWeight.normal,
          }}
        >
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  // Stat item component
  const StatItem = ({
    value,
    label,
  }: {
    value: number | string;
    label: string;
  }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: theme.spacing.md,
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Text
        style={{
          fontSize: theme.fontSize["2xl"],
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          marginBottom: theme.spacing.xs,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
          fontWeight: theme.fontWeight.medium,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Settings section component
  const SettingRow = ({
    label,
    value,
    isEditing: editing = false,
    onChangeText,
    placeholder,
  }: {
    label: string;
    value: string;
    isEditing?: boolean;
    onChangeText?: (text: string) => void;
    placeholder?: string;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSize.base,
          color: theme.colors.textSecondary,
          fontWeight: theme.fontWeight.medium,
          flex: 1,
        }}
      >
        {label}
      </Text>
      {editing && onChangeText ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={{
            flex: 2,
            fontSize: theme.fontSize.base,
            color: theme.colors.text,
            fontWeight: theme.fontWeight.medium,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
          placeholderTextColor={theme.colors.textSecondary}
        />
      ) : (
        <Text
          style={{
            flex: 2,
            fontSize: theme.fontSize.base,
            color: theme.colors.text,
            fontWeight: theme.fontWeight.medium,
            textAlign: "right",
          }}
        >
          {value}
        </Text>
      )}
    </View>
  );

  // Quick action row component
  const QuickActionRow = ({
    icon,
    label,
    subtitle,
    onPress,
  }: {
    icon: string;
    label: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: withOpacity(theme.colors.primary, 0.08),
          alignItems: "center",
          justifyContent: "center",
          marginRight: theme.spacing.md,
        }}
      >
        <IconSymbol name={icon as any} size={20} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text,
            marginBottom: theme.spacing.xs,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <IconSymbol
        name="chevron.right"
        size={20}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  // Profile tab content
  const renderProfileTab = () => (
    <>
      <View
        style={{
          paddingVertical: theme.spacing.xxl,
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <ImageUpload
          type="avatar"
          currentImageUrl={avatarUrl}
          onUploadComplete={handleAvatarUpload}
          onUploadError={handleAvatarError}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text
          style={{
            fontSize: theme.fontSize["2xl"],
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
            marginTop: theme.spacing.lg,
          }}
        >
          {user?.profile?.full_name || "Name not provided"}
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.xs,
          }}
        >
          @{user?.profile?.username || "username"}
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.sm,
          }}
        >
          Joined {formatJoinDate(user?.profile?.created_at || "")}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingVertical: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <StatItem
          value={statsLoading ? "..." : stats.totalLogs}
          label="Total Logs"
        />
        <View
          style={{
            width: 1,
            backgroundColor: theme.colors.border,
            marginVertical: theme.spacing.sm,
          }}
        />
        <StatItem
          value={statsLoading ? "..." : stats.activeGroups}
          label="Active Groups"
        />
        <View
          style={{
            width: 1,
            backgroundColor: theme.colors.border,
            marginVertical: theme.spacing.sm,
          }}
        />
        <StatItem
          value={statsLoading ? "..." : stats.daysActive}
          label="Days Active"
        />
      </View>

      <View
        style={{
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.surface,
          marginTop: theme.spacing.md,
          borderRadius: theme.borderRadius.xl,
          marginHorizontal: theme.spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg,
          }}
        >
          Quick Actions
        </Text>
        <QuickActionRow
          icon="pencil"
          label="Edit Profile"
          subtitle="Update your personal information"
          onPress={handleEditPress}
        />
        <QuickActionRow
          icon="person.2"
          label="Groups"
          subtitle="Manage vehicle sharing groups"
          onPress={() => router.push("/groups")}
        />
        <QuickActionRow
          icon="lock.shield"
          label="Privacy & Terms"
          subtitle="View privacy policy and terms of service"
          onPress={() => router.push("/privacy")}
        />
      </View>
    </>
  );

  // Settings tab content
  const renderSettingsTab = () => (
    <>
      {isWeb && !isMobile && (
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          {isEditing ? (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <IconSymbol name="xmark" size={16} color={theme.colors.text} />
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.primary,
                }}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <IconSymbol name="checkmark" size={16} color="white" />
                    <Text
                      style={{
                        color: "white",
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.semibold,
                      }}
                    >
                      Save Changes
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.sm,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.primary,
              }}
              onPress={handleEditPress}
            >
              <IconSymbol name="pencil" size={16} color="white" />
              <Text
                style={{
                  color: "white",
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={{
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.surface,
          marginTop: theme.spacing.md,
          borderRadius: theme.borderRadius.xl,
          marginHorizontal: theme.spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg,
          }}
        >
          Theme
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
          }}
        >
          {(["system", "light", "dark"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={{
                flex: 1,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.borderRadius.md,
                backgroundColor:
                  themeMode === mode
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderWidth: 1,
                borderColor:
                  themeMode === mode
                    ? theme.colors.primary
                    : theme.colors.border,
                alignItems: "center",
              }}
              onPress={() => setThemeMode(mode)}
            >
              <IconSymbol
                name={
                  mode === "system"
                    ? "sparkles"
                    : mode === "light"
                      ? "sun.max"
                      : "moon"
                }
                size={20}
                color={
                  themeMode === mode ? "white" : theme.colors.textSecondary
                }
              />
              <Text
                style={{
                  marginTop: theme.spacing.sm,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  color: themeMode === mode ? "white" : theme.colors.text,
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View
        style={{
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.surface,
          marginTop: theme.spacing.md,
          borderRadius: theme.borderRadius.xl,
          marginHorizontal: theme.spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg,
          }}
        >
          Account Information
        </Text>
        <SettingRow
          label="Email"
          value={user?.email || "Not provided"}
          isEditing={false}
        />
        <SettingRow
          label="Username"
          value={username}
          isEditing={isEditing}
          onChangeText={setUsername}
          placeholder="Enter username"
        />
        <SettingRow
          label="Full Name"
          value={fullName}
          isEditing={isEditing}
          onChangeText={setFullName}
          placeholder="Enter full name"
        />
        <SettingRow
          label="Joined"
          value={formatJoinDate(user?.profile?.created_at || "")}
          isEditing={false}
        />
      </View>

      <NotificationPreferencesForm />

      {!isMobile && (
        <View
          style={{
            padding: theme.spacing.xl,
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.md,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.error,
            }}
            onPress={handleSignOut}
          >
            <IconSymbol name="arrow.right.square" size={16} color="white" />
            <Text
              style={{
                color: "white",
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
              }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaxWidthContainer>
        <View
          style={{
            flexDirection: "row",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <TabButton tab="Profile" />
          <TabButton tab="Settings" />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {activeTab === "Profile" && renderProfileTab()}
          {activeTab === "Settings" && renderSettingsTab()}

          {isMobile && (
            <View
              style={{
                padding: theme.spacing.xl,
                marginTop: theme.spacing.xl,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.error,
                }}
                onPress={handleSignOut}
              >
                <IconSymbol name="arrow.right.square" size={16} color="white" />
                <Text
                  style={{
                    color: "white",
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                  }}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </MaxWidthContainer>

      <Modal visible={showEditModal} onClose={() => setShowEditModal(false)}>
        <View style={{ padding: theme.spacing.xl }}>
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xl,
            }}
          >
            Edit Profile
          </Text>

          <View
            style={{ marginBottom: theme.spacing.lg, alignItems: "center" }}
          >
            <ImageUpload
              type="avatar"
              currentImageUrl={avatarUrl}
              onUploadComplete={handleAvatarUpload}
              onUploadError={handleAvatarError}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          </View>

          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm,
              }}
            >
              Full Name
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.text,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm,
              }}
            >
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.text,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
              }}
              onPress={() => {
                setShowEditModal(false);
                setFullName(user?.profile?.full_name || "");
                setUsername(user?.profile?.username || "");
              }}
            >
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
              }}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text
                  style={{
                    color: "white",
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                  }}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
