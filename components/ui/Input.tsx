import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from './icon-symbol';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'medium',
  required = false,
  disabled = false,
  multiline = false,
  maxLength,
  showCharacterCount = false,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle = [styles.container];

    if (containerStyle) {
      baseStyle.push(containerStyle);
    }

    return baseStyle;
  };

  const getInputContainerStyle = (): ViewStyle[] => {
    const baseStyle = [styles.inputContainer];

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.inputContainerSmall);
        break;
      case 'large':
        baseStyle.push(styles.inputContainerLarge);
        break;
      default:
        baseStyle.push(styles.inputContainerMedium);
    }

    // Variant styles
    switch (variant) {
      case 'outlined':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isFocused ? colors.tint : colors.icon + '40',
        });
        break;
      case 'filled':
        baseStyle.push({
          backgroundColor: colors.icon + '10',
          borderWidth: 1,
          borderColor: isFocused ? colors.tint : colors.icon + '20',
        });
        break;
      default:
        baseStyle.push({
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: isFocused ? colors.tint : colors.icon + '30',
        });
    }

    // State styles
    if (error) {
      baseStyle.push({ borderColor: '#ff4444' });
    } else if (success) {
      baseStyle.push({ borderColor: '#4CAF50' });
    }

    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    if (multiline) {
      baseStyle.push(styles.multiline);
    }

    return baseStyle;
  };

  const getInputStyle = (): TextStyle[] => {
    const baseStyle = [styles.input, { color: colors.text }];

    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.inputSmall);
        break;
      case 'large':
        baseStyle.push(styles.inputLarge);
        break;
      default:
        baseStyle.push(styles.inputMedium);
    }

    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }

    if (rightIcon) {
      baseStyle.push(styles.inputWithRightIcon);
    }

    if (multiline) {
      baseStyle.push(styles.inputMultiline);
    }

    if (inputStyle) {
      baseStyle.push(inputStyle);
    }

    return baseStyle;
  };

  const getLabelStyle = (): TextStyle[] => {
    const baseStyle = [styles.label, { color: colors.text }];

    if (required) {
      baseStyle.push(styles.requiredLabel);
    }

    if (labelStyle) {
      baseStyle.push(labelStyle);
    }

    return baseStyle;
  };

  const getHelperTextStyle = (): TextStyle[] => {
    if (error) {
      return [styles.helperText, styles.errorText];
    }
    if (success) {
      return [styles.helperText, styles.successText];
    }
    return [styles.helperText, { color: colors.icon }];
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 20;
      default:
        return 18;
    }
  };

  const getIconColor = () => {
    if (error) return '#ff4444';
    if (success) return '#4CAF50';
    if (isFocused) return colors.tint;
    return colors.icon;
  };

  const displayHelperText = error || success || helperText;
  const characterCount = value?.length || 0;

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </Text>
      )}

      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <IconSymbol
              name={leftIcon}
              size={getIconSize()}
              color={getIconColor()}
            />
          </View>
        )}

        <TextInput
          ref={ref}
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          multiline={multiline}
          maxLength={maxLength}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <IconSymbol
              name={rightIcon}
              size={getIconSize()}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </View>

      {(displayHelperText || (showCharacterCount && maxLength)) && (
        <View style={styles.bottomRow}>
          {displayHelperText && (
            <Text style={getHelperTextStyle()}>
              {error || success || helperText}
            </Text>
          )}
          {showCharacterCount && maxLength && (
            <Text style={[styles.characterCount, { color: colors.icon }]}>
              {characterCount}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  requiredLabel: {
    // Additional styling for required labels if needed
  },
  requiredAsterisk: {
    color: '#ff4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputContainerSmall: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  inputContainerMedium: {
    minHeight: 44,
    paddingHorizontal: 16,
  },
  inputContainerLarge: {
    minHeight: 52,
    paddingHorizontal: 20,
  },
  multiline: {
    minHeight: 80,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  disabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  inputSmall: {
    fontSize: 14,
  },
  inputMedium: {
    fontSize: 16,
  },
  inputLarge: {
    fontSize: 18,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  leftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  errorText: {
    color: '#ff4444',
  },
  successText: {
    color: '#4CAF50',
  },
  characterCount: {
    fontSize: 12,
    marginLeft: 8,
  },
});