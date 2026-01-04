// @ts-nocheck - Demo file with known unistyles type incompatibilities
/**
 * Demo Login Page
 *
 * Simplified login page for demo mode that accepts any credentials
 * and redirects to the demo dashboard.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { demoAuthService } from "@/lib/demo/demoServices";

export default function DemoLoginPage() {
  const { styles, theme } = useStyles(stylesheet);
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate login with demo service
      await demoAuthService.signIn(email, password);

      // Always redirect to demo dashboard
      router.replace("/demo/dashboard");
    } catch (error) {
      console.error("Demo login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = () => {
    // Skip directly to demo dashboard
    router.replace("/demo/dashboard");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Management</Text>
          <Text style={styles.subtitle}>Demo Mode</Text>
          <Text style={styles.description}>
            Try out all features with sample data. No registration required!
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="demo@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="demo123"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Tip: You can use any email and password in demo mode, or skip
              login entirely.
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login to Demo</Text>
            )}
          </TouchableOpacity>

          {/* Skip Login Button */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkipLogin}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Skip & Explore</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>What you can try:</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              View 3 demo vehicles with complete data
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Browse fuel logs and service history
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Explore analytics and cost tracking
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Add new entries (won&apos;t be saved)
            </Text>
          </View>
        </View>

        {/* Exit Demo Link */}
        <TouchableOpacity
          style={styles.exitDemo}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.exitDemoText}>Exit Demo Mode →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    ...(Platform.OS === "web" && {
      minHeight: "100vh",
    }),
  },
  content: {
    flex: 1,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface || theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  infoBox: {
    backgroundColor: theme.colors.info || "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  features: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 18,
    color: theme.colors.success || "#4CAF50",
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  exitDemo: {
    padding: 12,
    alignItems: "center",
  },
  exitDemoText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
  },
}));
