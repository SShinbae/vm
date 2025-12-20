import {
  AuthButton,
  AuthCheckbox,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthLink,
} from "@/components/auth";
import { useAlert, withWebAlert } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isValidEmail } from "@/utils/validation";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { showError } = useAlert();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showError("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);

      if (error) {
        setLoading(false);
        showError("Sign In Failed", error);
      } else {
        // Small delay to ensure session is established
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoading(false);
        router.replace("/(tabs)");
      }
    } catch {
      setLoading(false);
      showError(
        "Sign In Failed",
        "An unexpected error occurred. Please try again.",
      );
    }
  };

  const styles = StyleSheet.create({
    passwordLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "500",
    },
  });

  return (
    <AuthLayout>
      <AuthHeader
        icon="lock-closed"
        title="Welcome Back"
        subtitle="Please enter your details to sign in."
      />

      {/* Email Input */}
      <AuthInput
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        leftIcon="mail-outline"
        type="email"
      />

      {/* Password Input with Forgot Password Link */}
      <View style={{ marginBottom: 20 }}>
        <View style={styles.passwordLabelRow}>
          <Text style={styles.label}>Password</Text>
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <AuthInput
          label=""
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock-closed-outline"
          type="password"
        />
      </View>

      {/* Remember Me Checkbox */}
      <AuthCheckbox
        checked={rememberMe}
        onToggle={() => setRememberMe(!rememberMe)}
        label="Remember me for 30 days"
      />

      {/* Sign In Button */}
      <AuthButton
        title="Sign in"
        onPress={handleSignIn}
        loading={loading}
        disabled={!email.trim() || !password.trim()}
      />

      {/* Sign Up Section */}
      <AuthLink
        text="Don't have an account?"
        linkText="Sign up"
        href="/(auth)/register"
      />
    </AuthLayout>
  );
}

export default withWebAlert(LoginScreen);
