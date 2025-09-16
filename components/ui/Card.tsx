import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
}

interface TouchableCardProps extends CardProps, Omit<TouchableOpacityProps, 'style' | 'children'> {}

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  onPress,
  disabled = false,
}: CardProps | TouchableCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCardStyle = (): ViewStyle[] => {
    const baseStyle = [styles.card];

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.push({
          backgroundColor: colors.background,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderWidth: 0,
        });
        break;
      case 'outlined':
        baseStyle.push({
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.icon + '30',
        });
        break;
      case 'filled':
        baseStyle.push({
          backgroundColor: colors.icon + '05',
          borderWidth: 1,
          borderColor: colors.icon + '10',
        });
        break;
      default:
        baseStyle.push({
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.icon + '20',
        });
    }

    // Padding styles
    switch (padding) {
      case 'none':
        break;
      case 'small':
        baseStyle.push(styles.paddingSmall);
        break;
      case 'large':
        baseStyle.push(styles.paddingLarge);
        break;
      default:
        baseStyle.push(styles.paddingMedium);
    }

    // Disabled state
    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    // Custom style
    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
}

// Header component for cards
export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

// Content component for cards
export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

// Footer component for cards
export function CardFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.footer, { borderTopColor: colors.icon + '10' }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 20,
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});