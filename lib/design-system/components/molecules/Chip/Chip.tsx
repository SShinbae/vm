import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { allIcons } from '../../../icons';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Avatar } from '../../atoms/Avatar';
import { Icon } from '../../atoms/Icon';
import { Text } from '../../atoms/Text';

export interface ChipProps extends Omit<ViewProps, 'style'> {
  label: string;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md';
  selected?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof allIcons;
  avatar?: string | ImageSourcePropType;
  onPress?: () => void;
  onDismiss?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  leftIcon,
  avatar,
  onPress,
  onDismiss,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const sizeConfig = {
    sm: {
      height: 24,
      paddingHorizontal: tokens.spacing.xs,
      fontSize: tokens.fontSize.xs,
      iconSize: 14 as const,
      avatarSize: 'xs' as const,
    },
    md: {
      height: 32,
      paddingHorizontal: tokens.spacing.sm,
      fontSize: tokens.fontSize.sm,
      iconSize: 16 as const,
      avatarSize: 'sm' as const,
    },
  };

  const config = sizeConfig[size];

  const variantConfig = {
    default: {
      background: selected ? colors.tint : colors.card,
      backgroundPressed: selected ? colors.tint + 'DD' : colors.card + 'DD',
      text: selected ? '#FFFFFF' : colors.text,
      border: colors.border,
    },
    outlined: {
      background: selected ? colors.tint + '20' : 'transparent',
      backgroundPressed: selected ? colors.tint + '30' : colors.tint + '10',
      text: selected ? colors.tint : colors.text,
      border: selected ? colors.tint : colors.border,
    },
    filled: {
      background: selected ? colors.tint : colors.backgroundSecondary,
      backgroundPressed: selected ? colors.tint + 'DD' : colors.backgroundSecondary + 'DD',
      text: selected ? '#FFFFFF' : colors.text,
      border: 'transparent',
    },
  };

  const colorConfig = variantConfig[variant];

  const chipContent = (
    <View
      style={[
        styles.chip,
        {
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
          backgroundColor: colorConfig.background,
          borderWidth: variant === 'outlined' || variant === 'default' ? 1 : 0,
          borderColor: colorConfig.border,
          borderRadius: config.height / 2,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      {...props}
    >
      {avatar && (
        <Avatar
          source={typeof avatar === 'string' ? { uri: avatar } : avatar}
          name={label}
          size={config.avatarSize}
          style={styles.avatar}
        />
      )}

      {!avatar && leftIcon && (
        <Icon
          name={leftIcon}
          size={config.iconSize}
          color="primary"
          style={styles.leftIcon}
        />
      )}

      <Text
        variant="label"
        weight="medium"
        style={{
          fontSize: config.fontSize,
          color: colorConfig.text,
        }}
      >
        {label}
      </Text>

      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          disabled={disabled}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${label}`}
          hitSlop={8}
        >
          <Icon
            name="close"
            size={config.iconSize}
            color="primary"
          />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? colorConfig.backgroundPressed : 'transparent',
            borderRadius: config.height / 2,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        accessibilityLabel={label}
      >
        {chipContent}
      </Pressable>
    );
  }

  return chipContent;
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: tokens.spacing.xxs,
  },
  leftIcon: {
    marginRight: tokens.spacing.xxs,
  },
  dismissButton: {
    marginLeft: tokens.spacing.xxs,
    padding: tokens.spacing.xxxs,
  },
});
