import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardContent } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MaintenanceScreenProps {
  message?: string;
  estimatedTime?: string;
}

export function MaintenanceScreen({
  message = 'We are currently performing scheduled maintenance',
  estimatedTime,
}: MaintenanceScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Card variant="elevated" padding="large" style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol
              name="wrench.and.screwdriver.fill"
              size={64}
              color={colors.tint}
            />
          </View>

          <CardContent>
            <ThemedText type="title" style={styles.title}>
              Under Maintenance
            </ThemedText>

            <ThemedText style={styles.message}>
              {message}
            </ThemedText>

            {estimatedTime && (
              <View style={styles.estimatedTimeContainer}>
                <IconSymbol
                  name="clock.fill"
                  size={20}
                  color={colors.icon}
                  style={styles.clockIcon}
                />
                <ThemedText style={styles.estimatedTime}>
                  Estimated time: {estimatedTime}
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.footer}>
              We'll be back shortly. Thank you for your patience.
            </ThemedText>
          </CardContent>
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
  },
  card: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 28,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  clockIcon: {
    marginRight: 8,
  },
  estimatedTime: {
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
});