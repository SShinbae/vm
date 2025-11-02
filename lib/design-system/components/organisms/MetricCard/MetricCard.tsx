import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon } from '@/lib/design-system/components/atoms/Icon';
import { Spacer } from '@/lib/design-system/components/atoms/Spacer';
import { Text } from '@/lib/design-system/components/atoms/Text';
import { Card } from '@/lib/design-system/components/molecules/Card';
import { theme } from '@/lib/design-system/theme';
import { tokens } from '@/lib/design-system/tokens';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { MetricCardProps, TrendDirection } from './MetricCard.types';

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  comparison,
  variant = 'default',
  loading = false,
  onPress,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const getTrendColor = (direction?: TrendDirection) => {
    switch (direction) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendIcon = (direction?: TrendDirection) => {
    switch (direction) {
      case 'up':
        return 'up' as const;
      case 'down':
        return 'down' as const;
      default:
        return 'forward' as const;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      default:
        return colors.tint;
    }
  };

  if (loading) {
    return (
      <Card variant="elevated">
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      onPress={onPress && !disabled ? onPress : undefined}
    >
      <View style={styles.container}>
        {/* Icon */}
        {icon && (
          <>
            <View style={[styles.iconContainer, { backgroundColor: getVariantColor() + '20' }]}>
              <Icon name={icon} size="md" color={variant === 'default' ? 'primary' : variant} />
            </View>
            <Spacer size="md" />
          </>
        )}

        {/* Label */}
        <Text variant="body" size="sm" color="secondary">
          {label}
        </Text>

        <Spacer size="xs" />

        {/* Value */}
        <Text variant="heading" size="xl" weight="bold">
          {value}
        </Text>

        {/* Trend & Comparison */}
        {(trend || comparison) && (
          <>
            <Spacer size="sm" />
            <View style={styles.footer}>
              {trend && trendValue && (
                <View style={styles.trendContainer}>
                  <Icon
                    name={getTrendIcon(trend)}
                    size="xs"
                    color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'secondary'}
                  />
                  <Spacer size="xxs" horizontal />
                  <Text
                    variant="body"
                    size="sm"
                    weight="medium"
                    style={{ color: getTrendColor(trend) }}
                  >
                    {trendValue}
                  </Text>
                </View>
              )}
              {comparison && (
                <Text variant="body" size="xs" color="secondary">
                  {comparison}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
