import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import {
  AuthButton,
  AuthCheckbox,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthLink,
  GoogleSignInButton,
} from "@/components/auth";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { postLoginRoute } from "@/lib/utils/postLoginRoute";
import { supabase } from "@/services/supabaseClient";
import { safeNext, takeRememberedNext } from "@/lib/utils/safeNext";
import { isValidEmail } from "@/utils/validation";
import { Link, router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const loginAttempted = useRef(false);
  const redirected = useRef(false);
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn, user, initialized } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme } = useStyles();
  const colors = theme.colors;

  const destination = () => safeNext(next) ?? takeRememberedNext() ?? "/(tabs)";

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
    // One-shot: a later profile load must not navigate again (and eat `next`).
    if (user && !redirected.current) {
      redirected.current = true;
      void (async () => {
        router.replace((await postLoginRoute(user.id, destination())) as never);
      })();
    }
    // destination() only reads `next`/storage; the redirected ref makes this one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        loginAttempted.current = false;
        showError(error);
        setLoading(false);
        return;
      }

      // Success - navigate to dashboard
      console.log("Login successful, navigating to dashboard");
      showSuccess("Welcome back!");
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      const dest = destination();
      redirected.current = true;
      router.replace((uid ? await postLoginRoute(uid, dest) : dest) as never);
    } catch (err) {
      console.log("Login catch block:", err);
      loginAttempted.current = false;
      showError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    passwordLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
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
      <View style={{ marginBottom: spacing.xl }}>
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

      <GoogleSignInButton />

      {/* Sign Up Section */}
      <AuthLink
        text="Don't have an account?"
        linkText="Sign up"
        href="/(auth)/register"
      />
    </AuthLayout>
  );
}

export default LoginScreen;
