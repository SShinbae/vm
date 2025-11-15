import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";

export interface TextComponentProps extends Omit<RNTextProps, "style"> {
  variant?: "display" | "heading" | "title" | "body" | "caption" | "label";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "light" | "regular" | "medium" | "semibold" | "bold";
  color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "error"
    | "warning"
    | "info";
  align?: "left" | "center" | "right" | "justify";
  numberOfLines?: number;
  children: React.ReactNode;
  style?: RNTextProps["style"];
}

export const Text: React.FC<TextComponentProps> = ({
  variant = "body",
  size = "md",
  weight = "regular",
  color = "primary",
  align = "left",
  numberOfLines,
  children,
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  // Variant-based font sizes
  const variantSizes: Record<typeof variant, keyof typeof tokens.fontSize> = {
    display: "xxxxl",
    heading: "xxxl",
    title: "xxl",
    body: "base",
    caption: "sm",
    label: "xs",
  };

  // Size overrides
  const sizeMap: Record<typeof size, keyof typeof tokens.fontSize> = {
    xs: "xs",
    sm: "sm",
    md: "base",
    lg: "lg",
    xl: "xl",
  };

  // Final font size (size prop overrides variant default)
  const fontSize =
    size !== "md"
      ? tokens.fontSize[sizeMap[size]]
      : tokens.fontSize[variantSizes[variant]];

  // Font weight mapping
  const fontWeight = tokens.fontWeight[weight];

  // Color mapping
  const colorMap: Record<typeof color, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  const textColor = colorMap[color];

  // Line height based on variant
  const lineHeightMap: Record<typeof variant, keyof typeof tokens.lineHeight> =
    {
      display: "tight",
      heading: "tight",
      title: "snug",
      body: "normal",
      caption: "normal",
      label: "normal",
    };

  const lineHeight = tokens.lineHeight[lineHeightMap[variant]];

  return (
    <RNText
      style={[
        styles.base,
        {
          fontSize,
          fontWeight,
          color: textColor,
          textAlign: align,
          lineHeight: fontSize * lineHeight,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      accessibilityRole="text"
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    margin: 0,
    padding: 0,
  },
});
