import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode, useRef, useState } from "react";
import {
  Animated,
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface AuthInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  leftIcon?: IoniconsName;
  type?: "text" | "email" | "password";
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  error?: string;
  helperText?: string;
  children?: ReactNode;
}

/**
 * AuthInput - Styled text input with icons, focus animations, and password toggle
 *
 * Features:
 * - Left icon with focus color change
 * - Built-in eye icon toggle for password fields
 * - Smooth focus transition (200ms border + background animation)
 * - Error and helper text display
 * - Support for children (e.g., PasswordStrengthIndicator)
 */
export function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  leftIcon,
  type = "text",
  keyboardType,
  autoCapitalize = "none",
  autoCorrect = false,
  error,
  helperText,
  children,
}: AuthInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated values for smooth focus transition
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Interpolate animated values
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.card],
  });

  const borderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  // Determine keyboard type based on input type
  const getKeyboardType = (): KeyboardTypeOptions => {
    if (keyboardType) return keyboardType;
    if (type === "email") return "email-address";
    return "default";
  };

  const isPassword = type === "password";
  const secureTextEntry = isPassword && !showPassword;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
    },
    inputIcon: {
      position: "absolute",
      left: 16,
      zIndex: 1,
    },
    input: {
      flex: 1,
      borderRadius: 8,
      paddingHorizontal: leftIcon ? 48 : 16,
      paddingRight: isPassword ? 48 : 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      minHeight: 52,
    },
    eyeIcon: {
      position: "absolute",
      right: 16,
      zIndex: 1,
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
      marginLeft: 4,
    },
    errorText: {
      fontSize: 12,
      color: colors.error || "#EF4444",
      marginTop: 6,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {leftIcon && (
          <View style={styles.inputIcon}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary : colors.textSecondary}
            />
          </View>
        )}
        <Animated.View
          style={{
            flex: 1,
            borderWidth: borderWidth,
            borderColor: error ? colors.error || "#EF4444" : borderColor,
            backgroundColor: backgroundColor,
            borderRadius: 8,
          }}
        >
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            keyboardType={getKeyboardType()}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            secureTextEntry={secureTextEntry}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Animated.View>
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      {children}
    </View>
  );
}
