import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Modal } from "@/components/ui/Modal";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

// Type for tab names
type TabName = "Profile" | "Settings" | "Notifications";

export default function ProfileScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { showConfirm, hideConfirm } = useDialog();
  const { styles, theme } = useStyles(stylesheet);
  const { isMobile } = useResponsiveLayout();

  const [fullName, setFullName] = useState(user?.profile?.full_name || "");
  const [username, setUsername] = useState(user?.profile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabName>("Profile");

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    logUpdates: true,
    groupMembers: true,
    invitations: true,
    inAppToasts: true,
    pushNotifications: true,
  });

  const isWeb = Platform.OS === "web";

  // Update avatar state when user profile changes
  useEffect(() => {
    setAvatarUrl(user?.profile?.avatar_url || null);
  }, [user?.profile?.avatar_url]);

  // Load notification preferences
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem("notification_preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        setNotificationPrefs(prefs);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  };

  const saveNotificationPreferences = async (
    prefs: typeof notificationPrefs,
  ) => {
    try {
      await AsyncStorage.setItem(
        "notification_preferences",
        JSON.stringify(prefs),
      );
      setNotificationPrefs(prefs);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      Alert.alert("Error", "Failed to save notification preferences");
    }
  };

  const updateNotificationPref = (
    key: keyof typeof notificationPrefs,
    value: boolean,
  ) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    saveNotificationPreferences(newPrefs);
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      username: username.trim() || null,
      avatar_url: avatarUrl,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Update Failed", error);
    } else {
      if (isWeb) {
        setIsEditing(false);
      } else {
        setShowEditModal(false);
      }
      Alert.alert("Success", "Profile updated successfully");
    }
  };

  const handleAvatarUpload = (imageUrl: string) => {
    console.log("🖼️ handleAvatarUpload called with URL:", imageUrl);
    setAvatarUrl(imageUrl);

    console.log("🔄 Updating profile in AuthContext (background)...");
    updateProfile({
      full_name: user?.profile?.full_name || "",
      username: user?.profile?.username || null,
      avatar_url: imageUrl,
    })
      .then((result) => {
        console.log("✅ Profile update complete:", result);
      })
      .catch((error) => {
        console.error("❌ Profile update failed:", error);
      });
  };

  const handleAvatarError = (error: string) => {
    Alert.alert("Avatar Upload Error", error);
  };

  const handleEditPress = () => {
    if (isWeb) {
      setIsEditing(true);
    } else {
      setShowEditModal(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFullName(user?.profile?.full_name || "");
    setUsername(user?.profile?.username || "");
    setAvatarUrl(user?.profile?.avatar_url || null);
  };

  const handleSignOut = async () => {
    showConfirm(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        try {
          await signOut();
          hideConfirm();
          router.replace("/(auth)/login");
        } catch (error) {
          console.error("Error signing out:", error);
          hideConfirm();
        }
      },
      undefined,
      "Sign Out",
      "Cancel",
      true,
    );
  };

  /**
   * TabBar Component - Renders horizontal tabs for navigation
   * On web/desktop: Segmented control style
   * On mobile: Top tabs with underline indicator
   */
  const TabBar = ({
    activeTab,
    onTabChange,
  }: {
    activeTab: TabName;
    onTabChange: (tab: TabName) => void;
  }) => {
    const tabs: TabName[] = ["Profile", "Settings", "Notifications"];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
              isWeb && !isMobile && styles.tabWeb,
            ]}
            onPress={() => onTabChange(tab)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab} tab`}
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {/* Underline indicator for mobile */}
            {!isWeb && activeTab === tab && (
              <View style={styles.tabIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * StatItem Component - Displays a single statistic
   * Shows numeric value and label in a vertical layout
   */
  const StatItem = ({
    value,
    label,
  }: {
    value: number | string;
    label: string;
  }) => (
    <TouchableOpacity
      style={styles.statItem}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (!user) return null;

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  // Render Settings Tab Content
  const renderSettingsTab = () => (
    <>
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isWeb && isEditing ? (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelEdit}
              disabled={loading}
            >
              <IconSymbol name="xmark" size={16} color={theme.colors.text} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <IconSymbol name="checkmark" size={16} color="white" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <IconSymbol name="pencil" size={16} color="white" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Theme Selection */}
      <View style={styles.informationSection}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === "system" && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode("system")}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === "system" && styles.themeOptionTextActive,
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === "light" && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode("light")}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === "light" && styles.themeOptionTextActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === "dark" && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode("dark")}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === "dark" && styles.themeOptionTextActive,
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Account Information Section */}
      <View style={styles.informationSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Username</Text>
          {isWeb && isEditing ? (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.textSecondary}
            />
          ) : (
            <Text style={styles.infoValue}>
              @{user.profile?.username || "Not set"}
            </Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name</Text>
          {isWeb && isEditing ? (
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoCorrect={false}
              placeholderTextColor={theme.colors.textSecondary}
            />
          ) : (
            <Text style={styles.infoValue}>
              {user.profile?.full_name || "Not provided"}
            </Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Joined</Text>
          <Text style={styles.infoValue}>
            {formatJoinDate(user.profile?.created_at || "")}
          </Text>
        </View>
      </View>

      {/* Sign Out Button */}
      {isWeb && !isMobile && (
        <View style={[styles.informationSection, { paddingTop: 0 }]}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: "#ff4444" }]}
            onPress={handleSignOut}
          >
            <IconSymbol
              name="arrow.right.square.fill"
              size={16}
              color="white"
            />
            <Text style={styles.editButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // Render Notifications Tab Content
  const renderNotificationsTab = () => (
    <>
      {/* Activity Notifications Section */}
      <View style={styles.informationSection}>
        <Text style={styles.sectionTitle}>Activity Notifications</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Log Updates</Text>
          <Switch
            value={notificationPrefs.logUpdates}
            onValueChange={(value) =>
              updateNotificationPref("logUpdates", value)
            }
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={
              notificationPrefs.logUpdates
                ? "white"
                : theme.colors.textSecondary
            }
          />
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Group Members</Text>
          <Switch
            value={notificationPrefs.groupMembers}
            onValueChange={(value) =>
              updateNotificationPref("groupMembers", value)
            }
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={
              notificationPrefs.groupMembers
                ? "white"
                : theme.colors.textSecondary
            }
          />
        </View>
      </View>

      {/* System Notifications Section */}
      <View style={styles.informationSection}>
        <Text style={styles.sectionTitle}>System Notifications</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Invitations</Text>
          <Switch
            value={notificationPrefs.invitations}
            onValueChange={(value) =>
              updateNotificationPref("invitations", value)
            }
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={
              notificationPrefs.invitations
                ? "white"
                : theme.colors.textSecondary
            }
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>In-App Toasts</Text>
          <Switch
            value={notificationPrefs.inAppToasts}
            onValueChange={(value) =>
              updateNotificationPref("inAppToasts", value)
            }
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={
              notificationPrefs.inAppToasts
                ? "white"
                : theme.colors.textSecondary
            }
          />
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Push Notifications</Text>
          <Switch
            value={notificationPrefs.pushNotifications}
            onValueChange={(value) =>
              updateNotificationPref("pushNotifications", value)
            }
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={
              notificationPrefs.pushNotifications
                ? "white"
                : theme.colors.textSecondary
            }
          />
        </View>
      </View>
    </>
  );

  // Render Profile Tab Content
  const renderProfileTab = () => (
    <>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <ImageUpload
          type="avatar"
          currentImageUrl={avatarUrl}
          onUploadComplete={handleAvatarUpload}
          onUploadError={handleAvatarError}
          style={styles.profileAvatarUpload}
        />
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Text style={styles.name}>
          {user.profile?.full_name || "Name not provided"}
        </Text>
        <Text style={styles.username}>
          @{user.profile?.username || "username"}
        </Text>
        <View style={styles.locationRow}>
          <Text style={styles.joinDate}>
            Joined {formatJoinDate(user.profile?.created_at || "")}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <StatItem value={0} label="Total Logs" />
        <View style={styles.statDivider} />
        <StatItem value={0} label="Active Groups" />
        <View style={styles.statDivider} />
        <StatItem value={0} label="Days Active" />
      </View>

      {/* Quick Actions Section */}
      <View style={styles.informationSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={[styles.quickActionRow, { marginBottom: 12 }]}
          onPress={handleEditPress}
        >
          <View style={styles.quickActionIcon}>
            <IconSymbol name="pencil" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionLabel}>Edit Profile</Text>
            <Text style={styles.quickActionSubtitle}>
              Update your personal information
            </Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionRow, { marginBottom: 12 }]}
          onPress={() => router.push("/groups" as any)}
        >
          <View style={styles.quickActionIcon}>
            <IconSymbol
              name="person.3.fill"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionLabel}>Groups</Text>
            <Text style={styles.quickActionSubtitle}>
              Manage your vehicle groups
            </Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionRow} activeOpacity={0.5}>
          <View style={styles.quickActionIcon}>
            <IconSymbol
              name="lock.fill"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionLabel}>Privacy Settings</Text>
            <Text style={styles.quickActionSubtitle}>Coming soon</Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={theme.colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="arrow.right.square.fill"
              size={18}
              color="#ff4444"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Tab Bar - Sticky below header */}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Render active tab content */}
          {activeTab === "Profile" && renderProfileTab()}
          {activeTab === "Settings" && renderSettingsTab()}
          {activeTab === "Notifications" && renderNotificationsTab()}
        </View>
      </ScrollView>

      {/* Edit Profile Modal - Only show on mobile */}
      {!isWeb && (
        <Modal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setFullName(user.profile?.full_name || "");
            setUsername(user.profile?.username || "");
            setAvatarUrl(user.profile?.avatar_url || null);
          }}
          title="Edit Profile"
          size="medium"
          closeOnBackdrop={!loading}
        >
          <View style={styles.modalContent}>
            {/* Avatar Upload */}
            <View style={styles.modalAvatarContainer}>
              <ImageUpload
                type="avatar"
                currentImageUrl={avatarUrl}
                onUploadComplete={handleAvatarUpload}
                onUploadError={handleAvatarError}
                style={styles.modalAvatarUpload}
              />
              <Text style={styles.modalAvatarText}>
                Tap to change profile picture
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.modalForm}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Username</Text>
                <TextInput
                  style={styles.modalInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Email</Text>
                <Text style={styles.modalEmailText}>{user.email}</Text>
                <Text style={styles.modalEmailSubtext}>
                  Email cannot be changed
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setFullName(user.profile?.full_name || "");
                  setUsername(user.profile?.username || "");
                  setAvatarUrl(user.profile?.avatar_url || null);
                }}
                disabled={loading}
              >
                <IconSymbol name="xmark" size={16} color={theme.colors.text} />
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <IconSymbol name="checkmark" size={16} color="white" />
                    <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// Stylesheet using Unistyles
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  headerBackground: {
    height: 120,
    backgroundColor: theme.colors.primary,
    position: "relative",
    overflow: "hidden",
  },
  circlePattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  logoutButton: {
    position: "absolute",
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  notificationButton: {
    position: "absolute",
    top: theme.spacing.lg,
    right: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
  },
  circle: {
    position: "absolute",
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  circle1: {
    width: 80,
    height: 80,
    top: -20,
    left: 50,
  },
  circle2: {
    width: 120,
    height: 120,
    top: -30,
    right: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    bottom: -10,
    left: 30,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: theme.spacing.xxl,
  },
  profileAvatarUpload: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  username: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  name: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    justifyContent: "space-between",
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    flex: 1,
    marginRight: theme.spacing.sm,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  editButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  informationSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    flex: 2,
    textAlign: "right",
  },
  input: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    flex: 2,
    textAlign: "right",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  themeOptions: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  themeOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  themeOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  themeOptionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  themeOptionTextActive: {
    color: theme.colors.white,
  },
  // Tab Bar Styles
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    position: "relative",
  },
  tabWeb: {
    flex: 0,
    paddingHorizontal: theme.spacing.xl,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  activeTab: {},
  tabText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 1.5,
  },
  // Stats Section Styles
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  // Modal styles
  modalContent: {},
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  modalAvatarUpload: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  modalForm: {
    marginBottom: theme.spacing.xl,
  },
  modalField: {
    marginBottom: theme.spacing.xl,
  },
  modalLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  modalEmailText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
  },
  modalEmailSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  modalCancelButtonText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.base,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  modalSaveButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.base,
  },
}));
