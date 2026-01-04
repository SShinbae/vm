// @ts-nocheck - Demo file with known unistyles type incompatibilities
/**
 * Demo Profile Page
 *
 * Displays demo user profile and settings
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { DEMO_USER } from "@/lib/demo/mockData";
import { useDemoMode } from "@/lib/contexts/DemoContext";

export default function DemoProfilePage() {
  const { styles } = useStyles(stylesheet);
  const router = useRouter();
  const { disableDemoMode } = useDemoMode();

  const handleExitDemo = async () => {
    Alert.alert(
      "Exit Demo Mode",
      "Are you sure you want to exit demo mode? You will be redirected to the login page.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Exit",
          style: "destructive",
          onPress: async () => {
            await disableDemoMode();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {DEMO_USER.full_name?.charAt(0) || "D"}
          </Text>
        </View>
        <Text style={styles.profileName}>{DEMO_USER.full_name}</Text>
        <Text style={styles.profileUsername}>@{DEMO_USER.username}</Text>
        {DEMO_USER.bio && (
          <Text style={styles.profileBio}>{DEMO_USER.bio}</Text>
        )}
      </View>

      {/* Profile Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>demo@example.com</Text>
          </View>
          {DEMO_USER.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{DEMO_USER.phone}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member Since</Text>
            <Text style={styles.detailValue}>
              {new Date(DEMO_USER.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() =>
            Alert.alert("Demo Mode", "Profile editing is disabled in demo mode")
          }
        >
          <Text style={styles.settingText}>Edit Profile</Text>
          <Text style={styles.settingChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() =>
            Alert.alert("Demo Mode", "Preferences are disabled in demo mode")
          }
        >
          <Text style={styles.settingText}>Preferences</Text>
          <Text style={styles.settingChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() =>
            Alert.alert("Demo Mode", "Notifications are disabled in demo mode")
          }
        >
          <Text style={styles.settingText}>Notifications</Text>
          <Text style={styles.settingChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() =>
            Alert.alert(
              "Demo Mode",
              "Privacy settings are disabled in demo mode",
            )
          }
        >
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Text style={styles.settingChevron}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Demo Info */}
      <View style={styles.section}>
        <View style={styles.demoInfoCard}>
          <Text style={styles.demoInfoTitle}>🎭 Demo Mode Active</Text>
          <Text style={styles.demoInfoText}>
            You&apos;re exploring the app with sample data. Changes you make
            won&apos;t be saved. Create a free account to:
          </Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>
              ✓ Save your vehicles permanently
            </Text>
            <Text style={styles.benefitItem}>
              ✓ Track real fuel & service logs
            </Text>
            <Text style={styles.benefitItem}>
              ✓ Access your data from any device
            </Text>
            <Text style={styles.benefitItem}>✓ Share vehicles with groups</Text>
          </View>
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.createAccountText}>Create Free Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitDemo}>
          <Text style={styles.exitButtonText}>Exit Demo Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Vehicle Management App</Text>
        <Text style={styles.footerText}>Demo Version</Text>
      </View>
    </ScrollView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  profileCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  settingChevron: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  demoInfoCard: {
    backgroundColor: theme.colors.primary + "10",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + "30",
  },
  demoInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
  },
  demoInfoText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  createAccountButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  exitButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.error || "#F44336",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.error || "#F44336",
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
}));
