import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';

export interface CardProps extends Omit<ViewProps, 'style'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof tokens.spacing;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
}

export interface CardContentProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
}

export interface CardFooterProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  onPress,
  disabled = false,
  children,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 0,
      borderColor: 'transparent',
      ...tokens.shadows.sm,
    },
    elevated: {
      backgroundColor: colors.card,
      borderWidth: 0,
      borderColor: 'transparent',
      ...tokens.shadows.md,
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filled: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };

  const paddingValue = tokens.spacing[padding];
  const style = variantStyles[variant];

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: style.backgroundColor,
          borderWidth: style.borderWidth,
          borderColor: style.borderColor,
          borderRadius: tokens.radius.lg,
          padding: paddingValue,
          ...('shadowRadius' in style ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: (style as any).shadowOpacity,
            shadowRadius: (style as any).shadowRadius,
            elevation: (style as any).elevation || (style as any).shadowRadius,
          } : {}),
        },
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, ...props }) => (
  <View style={styles.header} {...props}>
    {children}
  </View>
);

export const CardContent: React.FC<CardContentProps> = ({ children, ...props }) => (
  <View style={styles.content} {...props}>
    {children}
  </View>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, ...props }) => (
  <View style={styles.footer} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    marginBottom: tokens.spacing.sm,
  },
  content: {
    // Content styles can be customized
  },
  footer: {
    marginTop: tokens.spacing.sm,
  },
});
