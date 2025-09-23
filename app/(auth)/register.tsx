import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim().toLowerCase(), password, fullName.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error);
    } else {
      router.replace({
        pathname: '/(auth)/email-confirmation',
        params: { email: email.trim().toLowerCase() }
      });
    }
  };

  const isFormValid = () => {
    return fullName.trim() && email.trim() && password.length >= 6 && password === confirmPassword && agreeToTerms;
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return { text: 'Too short', style: styles.passwordWeak };
    if (password.length < 8) return { text: 'Weak', style: styles.passwordWeak };
    if (password.length < 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { text: 'Strong', style: styles.passwordStrong };
    }
    if (password.length >= 8) return { text: 'Good', style: styles.passwordMedium };
    return { text: 'Weak', style: styles.passwordWeak };
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.facebook?.background || colors.surface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: 20,
    },
    content: {
      paddingHorizontal: 20,
      maxWidth: screenWidth > 600 ? 400 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.facebook?.primary || colors.tint,
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.facebook?.card || colors.background,
      borderRadius: 12,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.facebook?.lightGray || colors.surface,
      borderWidth: 1,
      borderColor: colors.facebook?.divider || colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      minHeight: 52,
    },
    inputFocused: {
      borderColor: colors.facebook?.primary || colors.tint,
      borderWidth: 2,
      backgroundColor: colors.facebook?.card || colors.background,
    },
    passwordStrength: {
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    passwordWeak: {
      color: colors.facebook?.error || '#F02849',
    },
    passwordMedium: {
      color: '#FFA500',
    },
    passwordStrong: {
      color: colors.facebook?.success || colors.facebook?.secondary,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.facebook?.divider || colors.border,
      borderRadius: 4,
      marginRight: 12,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.facebook?.primary || colors.tint,
      borderColor: colors.facebook?.primary || colors.tint,
    },
    checkboxText: {
      fontSize: 14,
      color: colors.facebook?.gray || colors.icon,
      flex: 1,
      lineHeight: 20,
    },
    termsLink: {
      color: colors.facebook?.primary || colors.tint,
      textDecorationLine: 'underline',
    },
    button: {
      backgroundColor: colors.facebook?.secondary || colors.facebook?.primary || colors.tint,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
      minHeight: 52,
      shadowColor: colors.facebook?.secondary || colors.facebook?.primary || colors.tint,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.facebook?.divider || colors.border,
    },
    dividerText: {
      color: colors.facebook?.gray || colors.icon,
      fontSize: 14,
      marginHorizontal: 16,
      fontWeight: '500',
    },
    signinContainer: {
      alignItems: 'center',
      backgroundColor: colors.facebook?.card || colors.background,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    signinText: {
      color: colors.facebook?.gray || colors.icon,
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },
    signinButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.facebook?.primary || colors.tint,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      minHeight: 44,
    },
    signinButtonText: {
      color: colors.facebook?.primary || colors.tint,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Vehicle Management</Text>
              <Text style={styles.title}>Create a new account</Text>
              <Text style={styles.subtitle}>
                Join Vehicle Management and start managing your vehicles with ease. Connect with other vehicle enthusiasts.
              </Text>
            </View>

            {/* Registration Card */}
            <View style={styles.card}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    fullNameFocused && styles.inputFocused,
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full name"
                  placeholderTextColor={colors.facebook?.placeholder || colors.icon}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    emailFocused && styles.inputFocused,
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.facebook?.placeholder || colors.icon}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    passwordFocused && styles.inputFocused,
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.facebook?.placeholder || colors.icon}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                {passwordStrength && (
                  <Text style={[styles.passwordStrength, passwordStrength.style]}>
                    {passwordStrength.text}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    confirmPasswordFocused && styles.inputFocused,
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.facebook?.placeholder || colors.icon}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
              </View>

              {/* Terms of Service Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                  {agreeToTerms && (
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxText}>
                  By clicking Sign Up, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms</Text>,{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text> and{' '}
                  <Text style={styles.termsLink}>Cookies Policy</Text>.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, (!isFormValid() || loading) && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={!isFormValid() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In Section */}
            <View style={styles.signinContainer}>
              <Text style={styles.signinText}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.signinButton}>
                  <Text style={styles.signinButtonText}>Log In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}