import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

export default function ConfirmEmailScreen() {
  const { token_hash, type } = useLocalSearchParams<{
    token_hash: string;
    type: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const confirmEmail = async () => {
      console.log('=== EMAIL CONFIRMATION DEBUG ===');
      console.log('URL params:', { token_hash, type });
      console.log('================================');

      if (!token_hash || !type) {
        console.error('Missing required params:', { token_hash, type });
        setError('Invalid confirmation link');
        setLoading(false);
        return;
      }

      try {
        console.log('Attempting to verify OTP...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'signup' | 'recovery' | 'email_change',
        });

        console.log('Verification result:', { data, error });

        if (error) {
          console.error('Email confirmation error:', error);
          setError(error.message || 'Failed to confirm email');
        } else if (data.user) {
          console.log('User confirmed successfully:', data.user.email);
          setConfirmed(true);
          // Sign out user after verification to ensure manual login
          console.log('Signing out user to force manual login...');
          await supabase.auth.signOut();
          // Redirect to confirmation success page after 2 seconds
          setTimeout(() => {
            console.log('Redirecting to confirmation success page...');
            setRedirecting(true);
            router.replace('/(auth)/confirmation-success');
          }, 2000);
        } else {
          console.error('No user data returned after verification');
          setError('Confirmation failed');
        }
      } catch (err) {
        console.error('Unexpected error during confirmation:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token_hash, type]);

  const handleGoToLogin = () => {
    setRedirecting(true);
    router.replace('/(auth)/confirmation-success');
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
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
      maxWidth: screenWidth > 600 ? 400 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    loadingIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.facebook?.primary || colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#4CAF50',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      shadowColor: '#4CAF50',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    errorIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F44336',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      shadowColor: '#F44336',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    iconText: {
      fontSize: 40,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
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
    primaryButton: {
      backgroundColor: colors.facebook?.primary || colors.tint,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
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
    primaryButtonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    redirectText: {
      fontSize: 14,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.loadingIcon}>
                <ActivityIndicator color="white" size="large" />
              </View>
              <Text style={styles.title}>Confirming Email</Text>
              <Text style={styles.subtitle}>
                Please wait while we verify your email address...
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.errorIcon}>
                <Text style={styles.iconText}>✕</Text>
              </View>
              <Text style={styles.title}>Confirmation Failed</Text>
              <Text style={styles.subtitle}>{error}</Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoToLogin}
              >
                <Text style={styles.primaryButtonText}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.iconText}>✓</Text>
              </View>
              <Text style={styles.title}>Email Confirmed!</Text>
              <Text style={styles.subtitle}>
                Your email has been successfully verified. Click continue to proceed to sign in.
              </Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  redirecting && styles.primaryButtonDisabled,
                ]}
                onPress={handleGoToLogin}
                disabled={redirecting}
              >
                {redirecting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue</Text>
                )}
              </TouchableOpacity>

              {!redirecting && (
                <Text style={styles.redirectText}>
                  Redirecting to success page in a moment...
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}