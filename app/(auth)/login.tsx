import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: screenWidth } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error);
    } else {
      router.replace('/(tabs)');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.facebook?.background || colors.surface,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
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
    tagline: {
      fontSize: 20,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      marginBottom: 40,
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
      marginBottom: 20,
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
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.facebook?.divider || colors.border,
      borderRadius: 4,
      marginRight: 12,
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
    },
    button: {
      backgroundColor: colors.facebook?.primary || colors.tint,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
      minHeight: 52,
      shadowColor: colors.facebook?.primary || colors.tint,
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
    forgotPasswordContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: colors.facebook?.primary || colors.tint,
      fontSize: 14,
      fontWeight: '500',
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
    signupContainer: {
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
    signupText: {
      color: colors.facebook?.gray || colors.icon,
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },
    signupButton: {
      backgroundColor: colors.facebook?.secondary || colors.facebook?.primary || colors.tint,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      minHeight: 44,
    },
    signupButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>VehicleSync</Text>
              <Text style={styles.tagline}>Connect with your vehicles</Text>
              <Text style={styles.subtitle}>Manage your fleet with ease</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
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
              </View>

              {/* Remember Me Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxText}>Keep me signed in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, (loading || !email.trim() || !password.trim()) && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <View style={styles.forgotPasswordContainer}>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>Forgotten password?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Section */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity style={styles.signupButton}>
                  <Text style={styles.signupButtonText}>Create new account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}