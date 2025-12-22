import { Colors } from "@/constants/theme";
import { Dimensions, StyleSheet } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

/**
 * Get auth colors based on color scheme
 */
export const getAuthColors = (colorScheme: "light" | "dark" | null) => {
  return Colors[colorScheme ?? "light"];
};

/**
 * Shared constants for auth components
 */
export const AUTH_CONSTANTS = {
  // Layout
  maxContentWidth: 450,
  tabletBreakpoint: 768,
  horizontalPadding: 24,
  verticalPadding: 40,

  // Icon container
  iconContainerSize: 80,
  iconContainerSizeLarge: 120,
  iconSize: 40,
  iconSizeLarge: 60,

  // Typography
  titleFontSize: 28,
  titleFontSizeLarge: 32,
  subtitleFontSize: 16,
  labelFontSize: 14,

  // Input
  inputMinHeight: 52,
  inputBorderRadius: 8,
  inputPaddingHorizontal: 48,
  inputPaddingVertical: 14,
  inputIconSize: 20,

  // Button
  buttonMinHeight: 52,
  buttonBorderRadius: 8,
  buttonPaddingVertical: 16,

  // Checkbox
  checkboxSize: 20,
  checkboxBorderRadius: 4,

  // Animation durations (ms)
  focusAnimationDuration: 200,
  pressAnimationDuration: 100,
  fadeInDuration: 300,
};

/**
 * Create base styles for auth components
 */
export const createAuthStyles = (colors: ReturnType<typeof getAuthColors>) => {
  return StyleSheet.create({
    // Layout styles
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: AUTH_CONSTANTS.horizontalPadding,
      justifyContent: "center",
      maxWidth:
        screenWidth > AUTH_CONSTANTS.tabletBreakpoint
          ? AUTH_CONSTANTS.maxContentWidth
          : ("100%" as any),
      alignSelf: "center",
      width: "100%",
      paddingVertical: AUTH_CONSTANTS.verticalPadding,
    },

    // Header styles
    iconContainer: {
      width: AUTH_CONSTANTS.iconContainerSize,
      height: AUTH_CONSTANTS.iconContainerSize,
      borderRadius: AUTH_CONSTANTS.iconContainerSize / 2,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 24,
    },
    iconContainerLarge: {
      width: AUTH_CONSTANTS.iconContainerSizeLarge,
      height: AUTH_CONSTANTS.iconContainerSizeLarge,
      borderRadius: AUTH_CONSTANTS.iconContainerSizeLarge / 2,
    },
    iconContainerSuccess: {
      backgroundColor: colors.success,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    title: {
      fontSize: AUTH_CONSTANTS.titleFontSize,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    titleLarge: {
      fontSize: AUTH_CONSTANTS.titleFontSizeLarge,
    },
    subtitle: {
      fontSize: AUTH_CONSTANTS.subtitleFontSize,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 40,
      lineHeight: 24,
      paddingHorizontal: 8,
    },

    // Input styles
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: AUTH_CONSTANTS.labelFontSize,
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
    inputIconRight: {
      position: "absolute",
      right: 16,
      zIndex: 1,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: AUTH_CONSTANTS.inputBorderRadius,
      paddingHorizontal: AUTH_CONSTANTS.inputPaddingHorizontal,
      paddingVertical: AUTH_CONSTANTS.inputPaddingVertical,
      fontSize: 16,
      color: colors.text,
      minHeight: AUTH_CONSTANTS.inputMinHeight,
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.card,
    },
    inputError: {
      borderColor: colors.error,
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
      marginLeft: 4,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 6,
      marginLeft: 4,
    },

    // Button styles
    button: {
      backgroundColor: colors.primary,
      borderRadius: AUTH_CONSTANTS.buttonBorderRadius,
      paddingVertical: AUTH_CONSTANTS.buttonPaddingVertical,
      alignItems: "center",
      marginBottom: 24,
      minHeight: AUTH_CONSTANTS.buttonMinHeight,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    buttonSecondary: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonSecondaryText: {
      color: colors.textSecondary,
    },
    buttonOutline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonOutlineText: {
      color: colors.primary,
    },

    // Checkbox styles
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    checkbox: {
      width: AUTH_CONSTANTS.checkboxSize,
      height: AUTH_CONSTANTS.checkboxSize,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: AUTH_CONSTANTS.checkboxBorderRadius,
      marginRight: 10,
      marginTop: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },

    // Link styles
    linkContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    linkText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    linkTextPrimary: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },

    // Divider styles
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginHorizontal: 16,
      fontWeight: "400",
    },

    // Back button styles
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    backButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "500",
    },
  });
};

export type AuthStyles = ReturnType<typeof createAuthStyles>;
