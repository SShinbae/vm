import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/services/supabaseClient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function ConfirmEmailScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = params.token_hash as string;
        const type = params.type as string;

        if (!token_hash || type !== 'email') {
          setError('Invalid confirmation link');
          setLoading(false);
          return;
        }

        const { error: confirmError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (confirmError) {
          setError(confirmError.message);
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 3000);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [params]);

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.facebook?.background || colors.surface,
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
    icon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    successIcon: {
      backgroundColor: colors.facebook?.secondary || '#4CAF50',
      shadowColor: colors.facebook?.secondary || '#4CAF50',
    },
    errorIcon: {
      backgroundColor: colors.facebook?.error || '#F02849',
      shadowColor: colors.facebook?.error || '#F02849',
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
    button: {
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
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color={colors.facebook?.primary || colors.tint} />
            <Text style={[styles.title, { marginTop: 24 }]}>Confirming your email...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.icon, styles.errorIcon]}>
              <Text style={styles.iconText}>✗</Text>
            </View>
            <Text style={styles.title}>Confirmation Failed</Text>
            <Text style={styles.subtitle}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.icon, styles.successIcon]}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.title}>Email Confirmed!</Text>
            <Text style={styles.subtitle}>
              Your email has been successfully verified. You will be redirected to login shortly.
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}