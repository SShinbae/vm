import {
  AuthButton,
  AuthCheckbox,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthLink,
} from "@/components/auth";
import { PasswordStrengthIndicator, withWebAlert } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { isValidEmail, validatePassword } from "@/utils/validation";
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signUp } = useAuth();
  const { showError, showSuccess, showWarning } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const validateForm = () => {
    if (!fullName.trim()) {
      showError("Please enter your full name");
      return false;
    }
    if (!email.trim()) {
      showError("Please enter your email");
      return false;
    }
    if (!isValidEmail(email)) {
      showError("Please enter a valid email address");
      return false;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showWarning("Password Requirements", {
        message: passwordValidation.errors.join(", "),
      });
      return false;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return false;
    }
    if (!agreeToTerms) {
      showError("Please agree to the Terms of Service");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    if (__DEV__) {
      console.log("=== REGISTRATION FLOW DEBUG ===");
      console.log("Starting registration for:", email.trim().toLowerCase());
    }

    setLoading(true);
    const { error } = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim(),
    );
    setLoading(false);

    if (error) {
      if (__DEV__) {
        console.error("Registration failed with error:", error);
      }
      showError("Registration Failed", { message: error });
    } else {
      if (__DEV__) {
        console.log(
          "Registration successful, redirecting to email confirmation page...",
        );
      }
      showSuccess("Account created!");
      router.replace({
        pathname: "/(auth)/email-confirmation",
        params: { email: email.trim().toLowerCase() },
      });
    }
  };

  const isFormValid = () => {
    return (
      fullName.trim() &&
      email.trim() &&
      isValidEmail(email) &&
      validatePassword(password).isValid &&
      password === confirmPassword &&
      agreeToTerms
    );
  };

  const styles = StyleSheet.create({
    termsLabel: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: "500",
    },
    passwordMismatch: {
      fontSize: 12,
      color: colors.error || "#EF4444",
      marginTop: 6,
      marginLeft: 4,
    },
  });

  const termsLabel = (
    <Text style={styles.termsLabel}>
      I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
      <Text style={styles.termsLink}>Privacy Policy</Text>
    </Text>
  );

  return (
    <AuthLayout>
      <AuthHeader
        icon="person-add"
        title="Create Account"
        subtitle="Join us today! It takes less than a minute."
      />

      {/* Full Name Input */}
      <AuthInput
        label="Full Name"
        placeholder="John Doe"
        value={fullName}
        onChangeText={setFullName}
        leftIcon="person-outline"
        autoCapitalize="words"
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

      {/* Password Input */}
      <AuthInput
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        leftIcon="lock-closed-outline"
        type="password"
      >
        <PasswordStrengthIndicator password={password} />
      </AuthInput>

      {/* Confirm Password Input */}
      <View>
        <AuthInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon="lock-closed-outline"
          type="password"
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.passwordMismatch}>Passwords do not match</Text>
        )}
      </View>

      {/* Terms Checkbox */}
      <AuthCheckbox
        checked={agreeToTerms}
        onToggle={() => setAgreeToTerms(!agreeToTerms)}
        label={termsLabel}
      />

      {/* Create Account Button */}
      <AuthButton
        title="Create Account"
        onPress={handleSignUp}
        loading={loading}
        disabled={!isFormValid()}
      />

      {/* Login Section */}
      <AuthLink
        text="Already have an account?"
        linkText="Log in"
        href="/(auth)/login"
      />
    </AuthLayout>
  );
}

export default withWebAlert(RegisterScreen);
