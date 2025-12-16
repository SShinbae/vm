import { withWebAlert } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    if (!agreeToTerms) {
      Alert.alert("Error", "Please agree to the Terms of Service");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    console.log("=== REGISTRATION FLOW DEBUG ===");
    console.log("Starting registration for:", email.trim().toLowerCase());

    setLoading(true);
    const { error } = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim(),
    );
    setLoading(false);

    if (error) {
      console.error("Registration failed with error:", error);
      Alert.alert("Registration Failed", error);
    } else {
      console.log(
        "Registration successful, redirecting to email confirmation page...",
      );
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
      password.length >= 6 &&
      password === confirmPassword &&
      agreeToTerms
    );
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6)
      return { text: "Too short", style: styles.passwordWeak };
    if (password.length < 8)
      return { text: "Weak", style: styles.passwordWeak };
    if (
      password.length < 12 &&
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      return { text: "Strong", style: styles.passwordStrong };
    }
    if (password.length >= 8)
      return { text: "Good", style: styles.passwordMedium };
    return { text: "Weak", style: styles.passwordWeak };
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      maxWidth: screenWidth > 768 ? 450 : "100%",
      alignSelf: "center",
      width: "100%",
      paddingVertical: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 40,
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputWrapper: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
    },
    inputIcon: {
      position: "absolute",
      left: 16,
      zIndex: 1,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 48,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      minHeight: 52,
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.card,
    },
    eyeIcon: {
      position: "absolute",
      right: 16,
      zIndex: 1,
    },
    passwordHelper: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
      marginLeft: 4,
    },
    passwordWeak: {
      color: colors.error || "#EF4444",
    },
    passwordMedium: {
      color: colors.warning || "#F59E0B",
    },
    passwordStrong: {
      color: colors.success || "#10B981",
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      marginRight: 10,
      marginTop: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: "500",
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 24,
      minHeight: 52,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginHorizontal: 16,
      fontWeight: "400",
    },
    loginContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    loginText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    loginLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
  });

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* User Plus Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-add"
                size={40}
                color={colors.primary}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us today! It takes less than a minute.
            </Text>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      fullNameFocused ? colors.primary : colors.textSecondary
                    }
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    fullNameFocused && styles.inputFocused,
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailFocused ? colors.primary : colors.textSecondary}
                  />
                </View>
                <TextInput
                  style={[styles.input, emailFocused && styles.inputFocused]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      passwordFocused ? colors.primary : colors.textSecondary
                    }
                  />
                </View>
                <TextInput
                  style={[styles.input, passwordFocused && styles.inputFocused]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHelper}>
                Must be at least 8 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      confirmPasswordFocused ? colors.primary : colors.textSecondary
                    }
                  />
                </View>
                <TextInput
                  style={[styles.input, confirmPasswordFocused && styles.inputFocused]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={[styles.passwordHelper, { color: colors.error }]}>
                  Passwords do not match
                </Text>
              )}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View
                style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
              >
                {agreeToTerms && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid() || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            {/* <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or register with</Text>
              <View style={styles.dividerLine} />
            </View> */}

            {/* Login Section */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default withWebAlert(RegisterScreen);
