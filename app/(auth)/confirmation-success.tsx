import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
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

const { width: screenWidth } = Dimensions.get('window');

export default function ConfirmationSuccessScreen() {
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGoToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToLogin = () => {
    if (redirecting) return;
    setRedirecting(true);
    router.replace('/(auth)/login');
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
    successIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#4CAF50',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      shadowColor: '#4CAF50',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    checkIcon: {
      fontSize: 50,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 18,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 8,
    },
    emailText: {
      fontSize: 16,
      color: colors.facebook?.primary || colors.tint,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 40,
    },
    card: {
      backgroundColor: colors.facebook?.card || colors.background,
      borderRadius: 16,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 24,
    },
    celebrationText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    descriptionText: {
      fontSize: 16,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    primaryButton: {
      backgroundColor: colors.facebook?.primary || colors.tint,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
      minHeight: 56,
      shadowColor: colors.facebook?.primary || colors.tint,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
      marginBottom: 16,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    countdownText: {
      fontSize: 14,
      color: colors.facebook?.gray || colors.icon,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    featuresList: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.facebook?.divider || colors.border,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureIcon: {
      fontSize: 18,
      color: '#4CAF50',
      marginRight: 12,
      width: 20,
    },
    featureText: {
      fontSize: 14,
      color: colors.facebook?.gray || colors.icon,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.title}>Welcome aboard!</Text>
            <Text style={styles.subtitle}>
              Your email has been successfully verified
            </Text>
          </View>

          {/* Success Card */}
          <View style={styles.card}>
            <Text style={styles.celebrationText}>
              🎉 Account Confirmed!
            </Text>
            <Text style={styles.descriptionText}>
              Your email has been successfully verified! You can now sign in to your account
              and start managing your vehicles, tracking maintenance, and accessing all features.
            </Text>

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
                <Text style={styles.primaryButtonText}>Continue to Sign In</Text>
              )}
            </TouchableOpacity>

            {!redirecting && countdown > 0 && (
              <Text style={styles.countdownText}>
                Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
              </Text>
            )}

            {/* Features Preview */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚗</Text>
                <Text style={styles.featureText}>Add and manage multiple vehicles</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔧</Text>
                <Text style={styles.featureText}>Track maintenance and service records</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⛽</Text>
                <Text style={styles.featureText}>Monitor fuel consumption and costs</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>View analytics and reports</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}