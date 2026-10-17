import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { withOpacity } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Modal } from "@/components/ui/Modal";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useSignOut } from "@/hooks/useSignOut";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

type TabName = "Profile" | "Settings";

function SettingRow({
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
}) {
  const { theme } = useStyles();
  const { isWeb, isMobile } = useResponsiveLayout();
  const compact = !isWeb || isMobile;
  return (
    <View
      style={{
        flexDirection: compact ? "column" : "row",
        gap: compact ? 8 : 16,
        justifyContent: "space-between",
        alignItems: compact ? "stretch" : "center",
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
          flex: compact ? undefined : 1,
        }}
      >
        {label}
      </Text>
      {editing && onChangeText ? (
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={{
            flex: compact ? undefined : 2,
            minWidth: 0,
            minHeight: 48,
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
            flex: compact ? undefined : 2,
            minWidth: 0,
            fontSize: theme.fontSize.base,
            color: theme.colors.text,
            fontWeight: theme.fontWeight.medium,
            textAlign: compact ? "left" : "right",
          }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { signOut, signingOut } = useSignOut();
  const { themeMode, setThemeMode } = useTheme();
  const { showSuccess, showError } = useToast();
  const { theme } = useStyles();
  const { isMobile, isWeb } = useResponsiveLayout();
  const isWebPage = isWeb && !isMobile;
  const { styles: web } = useStyles(webPageStyles);
  const profileName =
    user?.profile?.full_name?.trim() ||
    user?.profile?.username ||
    user?.email?.split("@")[0] ||
    "User";
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    hasData: statsReady,
    refetch: retryStats,
  } = useProfileStats();
  const {
    width: windowWidth,
    height: windowHeight,
    fontScale,
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stackCompact = !isWebPage && (windowWidth < 360 || fontScale >= 1.3);
  const compactPanel = {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginTop: 0,
    marginBottom: 16,
  };
  const saving = useRef(false);
  const saveRequest = useRef(0);

  const [fullName, setFullName] = useState(user?.profile?.full_name || "");
  const [username, setUsername] = useState(user?.profile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("Profile");

  useEffect(() => {
    const generation = saveRequest;
    saveRequest.current++;
    saving.current = false;
    setLoading(false);
    setShowEditModal(false);
    setIsEditing(false);
    setFullName(user?.profile?.full_name || "");
    setUsername(user?.profile?.username || "");
    return () => {
      generation.current++;
    };
    // Reset drafts only when the signed-in identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  useEffect(() => {
    if (!isEditing && !showEditModal) {
      setFullName(user?.profile?.full_name || "");
      setUsername(user?.profile?.username || "");
    }
  }, [
    user?.profile?.full_name,
    user?.profile?.username,
    isEditing,
    showEditModal,
  ]);

  const handleEditPress = () => {
    setFullName(user?.profile?.full_name || "");
    setUsername(user?.profile?.username || "");
    if (isWeb && !isMobile) {
      setIsEditing(true);
      setActiveTab("Settings");
    } else {
      setShowEditModal(true);
    }
  };

  const handleCancelEdit = () => {
    if (saving.current) return;
    setIsEditing(false);
    setShowEditModal(false);
    setFullName(user?.profile?.full_name || "");
    setUsername(user?.profile?.username || "");
  };

  const handleUpdateProfile = async () => {
    if (saving.current) return;
    saving.current = true;
    const request = ++saveRequest.current;
    setLoading(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        username: username.trim(),
      });
      if (request !== saveRequest.current) return;
      if (error) {
        showError("Couldn't update profile", { message: error });
        return;
      }
      setIsEditing(false);
      setShowEditModal(false);
      showSuccess("Profile updated");
    } catch {
      if (request === saveRequest.current)
        showError("Couldn't update profile", { message: "Please try again." });
    } finally {
      if (request === saveRequest.current) {
        saving.current = false;
        setLoading(false);
      }
    }
  };

  const handleAvatarUpload = async (url: string | null) => {
    setAvatarUrl(url);
    try {
      await refreshProfile();
    } catch {
      showError("Couldn't refresh your profile photo", {
        message: "Please reload to update the header photo.",
      });
    }
  };

  const handleSignOut = () => signOut({ confirm: true });

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Not available";
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
          minHeight: 48,
          justifyContent: "center",
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: isActive ? theme.colors.primary : "transparent",
          alignItems: "center",
        }}
        onPress={() => {
          setActiveTab(tab);
          router.setParams({ tab });
        }}
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
    <View
      style={{
        flex: stackCompact ? undefined : 1,
        minWidth: 0,
        alignItems: "center",
        paddingVertical: theme.spacing.md,
      }}
      accessible
      accessibilityLabel={`${value} ${label}`}
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
          textAlign: "center",
          fontWeight: theme.fontWeight.medium,
        }}
      >
        {label}
      </Text>
    </View>
  );

  // Quick action row component
  const QuickActionRow = ({
    icon,
    label,
    subtitle,
    onPress,
    destructive = false,
  }: {
    icon: string;
    label: string;
    subtitle: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        minHeight: 64,
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
          backgroundColor: withOpacity(
            destructive ? theme.colors.error : theme.colors.primary,
            0.08,
          ),
          alignItems: "center",
          justifyContent: "center",
          marginRight: theme.spacing.md,
        }}
      >
        <IconSymbol
          name={icon as any}
          size={20}
          color={destructive ? theme.colors.error : theme.colors.primary}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: destructive ? theme.colors.error : theme.colors.text,
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
          ...(isWebPage
            ? { ...web.panel, marginBottom: theme.spacing.lg }
            : compactPanel),
        }}
      >
        <ImageUpload
          type="avatar"
          fallbackName={profileName}
          currentImageUrl={avatarUrl}
          onUploadComplete={handleAvatarUpload}
          disabled={loading}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text
          style={{
            fontSize: theme.fontSize["2xl"],
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
            marginTop: theme.spacing.lg,
            textAlign: "center",
            alignSelf: "stretch",
            paddingHorizontal: isWebPage ? theme.spacing.lg : 0,
          }}
        >
          {profileName}
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.xs,
            maxWidth: "100%",
            textAlign: "center",
          }}
        >
          @{user?.profile?.username || "username"}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.sm,
            textAlign: "center",
            maxWidth: "100%",
          }}
        >
          {user?.email}
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
          flexDirection: stackCompact ? "column" : "row",
          paddingVertical: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          ...(isWebPage
            ? { ...web.panel, marginBottom: theme.spacing.lg }
            : compactPanel),
        }}
      >
        <StatItem
          value={
            statsLoading
              ? "..."
              : statsError && !statsReady
                ? "—"
                : stats.totalLogs
          }
          label="Total Logs"
        />
        <View
          style={{
            width: stackCompact ? undefined : 1,
            height: stackCompact ? 1 : undefined,
            backgroundColor: theme.colors.border,
            marginVertical: theme.spacing.sm,
          }}
        />
        <StatItem
          value={
            statsLoading
              ? "..."
              : statsError && !statsReady
                ? "—"
                : stats.activeGroups
          }
          label="Active Groups"
        />
        <View
          style={{
            width: stackCompact ? undefined : 1,
            height: stackCompact ? 1 : undefined,
            backgroundColor: theme.colors.border,
            marginVertical: theme.spacing.sm,
          }}
        />
        <StatItem
          value={
            statsLoading
              ? "..."
              : statsError && !statsReady
                ? "—"
                : stats.daysActive
          }
          label="Days Active"
        />
      </View>

      {statsError && (
        <View style={{ gap: 12, marginBottom: 16 }}>
          <Text
            accessibilityRole="alert"
            style={{ color: theme.colors.textSecondary }}
          >
            {statsError}
          </Text>
          <Button
            title="Retry statistics"
            variant="outline"
            onPress={() => {
              void retryStats();
            }}
            style={{ minHeight: 48 }}
          />
        </View>
      )}

      <View
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
          },
          isWebPage
            ? { ...web.panel, marginTop: 0, marginBottom: theme.spacing.lg }
            : compactPanel,
        ]}
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
        {!isWebPage && (
          <QuickActionRow
            icon="bell.fill"
            label="Notifications"
            subtitle="View your notifications and invitations"
            onPress={() => router.push("/notifications")}
          />
        )}
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
        <QuickActionRow
          icon="trash"
          label="Delete account"
          subtitle="Permanently delete your account and data"
          destructive
          onPress={() => router.push("/account/delete" as never)}
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
            justifyContent: "flex-end",
            ...(isWebPage
              ? {
                  backgroundColor: "transparent",
                  borderBottomWidth: 0,
                  paddingHorizontal: 0,
                  paddingTop: 0,
                }
              : compactPanel),
          }}
        >
          {isEditing ? (
            <>
              <TouchableOpacity
                style={{
                  flexGrow: 0,
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
                  flexGrow: 0,
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
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
          },
          isWebPage
            ? { ...web.panel, marginTop: 0, marginBottom: theme.spacing.lg }
            : compactPanel,
        ]}
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
            flexDirection: stackCompact ? "column" : "row",
            gap: theme.spacing.md,
          }}
        >
          {(["system", "light", "dark"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              accessibilityRole="button"
              accessibilityLabel={`${mode.charAt(0).toUpperCase() + mode.slice(1)} theme`}
              accessibilityState={{ selected: themeMode === mode }}
              style={{
                flex: stackCompact ? undefined : 1,
                minHeight: 48,
                minWidth: 0,
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
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
          },
          isWebPage
            ? { ...web.panel, marginTop: 0, marginBottom: theme.spacing.lg }
            : compactPanel,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            Account Information
          </Text>
          {!isWebPage && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit account information"
              onPress={handleEditPress}
              style={{
                minWidth: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol
                name="pencil"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
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

      {isWebPage && (
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
            disabled={signingOut}
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right"]}
    >
      <MaxWidthContainer
        fullWidth={isWebPage}
        style={isWebPage ? web.frame : undefined}
      >
        {isWebPage ? (
          <View style={web.toolbar}>
            <View style={web.filters}>
              {(["Profile", "Settings"] as const).map((tab) => (
                <WebFilterButton
                  key={tab}
                  label={tab}
                  selected={activeTab === tab}
                  onPress={() => {
                    setActiveTab(tab);
                    router.setParams({ tab });
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        <KeyboardAvoidingView
          enabled={Platform.OS !== "web"}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={
              isWebPage
                ? {
                    paddingHorizontal: theme.spacing.xl,
                    paddingBottom: theme.spacing.xl,
                  }
                : { paddingHorizontal: 16, paddingBottom: 32 }
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isWebPage && (
              <View>
                <MobilePageHeader
                  title="Profile"
                  subtitle="Manage your account and preferences"
                />
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: theme.spacing.lg,
                    gap: theme.spacing.sm,
                    backgroundColor: theme.colors.background,
                    borderBottomWidth: 0,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <TabButton tab="Profile" />
                  <TabButton tab="Settings" />
                </View>
              </View>
            )}
            {activeTab === "Profile" && renderProfileTab()}
            {activeTab === "Settings" && renderSettingsTab()}

            {!isWebPage && (
              <View
                style={{
                  padding: 0,
                  marginTop: theme.spacing.xl,
                }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: theme.spacing.sm,
                    minHeight: 48,
                    paddingVertical: theme.spacing.md,
                    paddingHorizontal: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.error,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Sign Out"
                  onPress={handleSignOut}
                  disabled={signingOut}
                >
                  <IconSymbol
                    name="arrow.right.square"
                    size={16}
                    color="white"
                  />
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
        </KeyboardAvoidingView>
      </MaxWidthContainer>

      <Modal
        visible={showEditModal}
        onClose={handleCancelEdit}
        closeOnBackdrop={!loading}
        showCloseButton={false}
        variant="bottom-sheet"
        contentStyle={{
          maxHeight: windowHeight - insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <KeyboardAvoidingView
          enabled={Platform.OS !== "web"}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            maxHeight: Math.max(
              120,
              windowHeight - insets.top - insets.bottom - 96,
            ),
          }}
        >
          <ScrollView
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              accessibilityRole="header"
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 24,
              }}
            >
              Edit Profile
            </Text>
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <ImageUpload
                type="avatar"
                fallbackName={profileName}
                currentImageUrl={avatarUrl}
                onUploadComplete={handleAvatarUpload}
                disabled={loading}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </View>
            <Input
              label="Full Name"
              accessibilityLabel="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              disabled={loading}
              inputStyle={{ minHeight: 48 }}
              textContentType="name"
              autoComplete="name"
            />
            <Input
              label="Username"
              accessibilityLabel="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              disabled={loading}
              inputStyle={{ minHeight: 48 }}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
            />
            <View
              style={{
                flexDirection: stackCompact ? "column" : "row",
                gap: 12,
                paddingTop: 8,
              }}
            >
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancelEdit}
                disabled={loading}
                style={{ flex: stackCompact ? undefined : 1, minHeight: 48 }}
              />
              <Button
                title="Save Changes"
                onPress={handleUpdateProfile}
                loading={loading}
                disabled={loading}
                style={{ flex: stackCompact ? undefined : 1, minHeight: 48 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
