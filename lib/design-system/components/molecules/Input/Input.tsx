import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { allIcons } from '../../../icons';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Icon } from '../../atoms/Icon';
import { Text } from '../../atoms/Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  leftIcon?: keyof typeof allIcons;
  rightIcon?: keyof typeof allIcons;
  onRightIconPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  successText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  fullWidth = true,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!errorText;
  const hasSuccess = !!successText && !hasError;

  // Border color based on state
  const getBorderColor = () => {
    if (hasError) return colors.error;
    if (hasSuccess) return colors.success;
    if (isFocused) return colors.tint;
    return colors.border;
  };

  // Icon color based on state
  const getIconColor = (): 'primary' | 'secondary' | 'error' | 'success' => {
    if (hasError) return 'error';
    if (hasSuccess) return 'success';
    return 'secondary';
  };

  const feedbackText = errorText || successText || helperText;

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      {label && (
        <Text
          variant="label"
          weight="medium"
          style={styles.label}
          color={hasError ? 'error' : 'primary'}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: 1,
            borderRadius: tokens.radius.md,
            backgroundColor: disabled ? colors.card + '40' : colors.card,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon name={leftIcon} size="sm" color={getIconColor()} />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: tokens.fontSize.base,
            },
          ]}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled }}
          {...props}
        />

        {rightIcon && (
          <Pressable
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            <Icon name={rightIcon} size="sm" color={getIconColor()} />
          </Pressable>
        )}
      </View>

      {feedbackText && (
        <Text
          variant="caption"
          style={styles.feedbackText}
          color={hasError ? 'error' : hasSuccess ? 'success' : 'secondary'}
        >
          {feedbackText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    marginBottom: tokens.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    minHeight: 44,
  },
  leftIconContainer: {
    paddingLeft: tokens.spacing.md,
  },
  rightIconContainer: {
    paddingRight: tokens.spacing.md,
  },
  feedbackText: {
    marginTop: tokens.spacing.xs,
  },
});
