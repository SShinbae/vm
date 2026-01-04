import {
  AuthButton,
  AuthCheckbox,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthLink,
} from "@/components/auth";
import { withWebAlert } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isValidEmail } from "@/utils/validation";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const loginAttempted = useRef(false);
  const { signIn, user, initialized } = useAuth();
  const { showSuccess, showError } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // If user is already logged in before any login attempt, redirect to dashboard
  // This handles the case where user navigates to login while already authenticated
  React.useEffect(() => {
    // Don't do anything until auth is initialized
    if (!initialized) return;

    // Never redirect if a login was attempted - this component handles its own navigation
    if (loginAttempted.current) {
      console.log("Login - not redirecting, login was attempted");
      return;
    }

    // Only redirect if user was already logged in before they came to this page
    if (user) {
      console.log("Login - redirecting to tabs, user already logged in");
      router.replace("/(tabs)");
    }
  }, [user, initialized]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showError("Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }

    // Mark that we're attempting login to prevent auto-redirect from stale sessions
    loginAttempted.current = true;
    setLoading(true);

    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);

      if (error) {
        console.log("Login error received:", error);
        showError(error);
        setLoading(false);
        return;
      }

      // Success - navigate to dashboard
      console.log("Login successful, navigating to dashboard");
      showSuccess("Welcome back!");
      router.replace("/(tabs)");
    } catch (err) {
      console.log("Login catch block:", err);
      showError("An unexpected error occurred. Please try again.");
      setLoading(false);
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
        onChangeText={handleEmailChange}
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
          onChangeText={handlePasswordChange}
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

      {/* Demo Mode Link */}
      {/* <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Link href="/demo/login" asChild>
          <TouchableOpacity style={{ padding: 10 }}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
              🎭 Try Demo Mode
            </Text>
          </TouchableOpacity>
        </Link>
      </View> */}
    </AuthLayout>
  );
}

export default withWebAlert(LoginScreen);
