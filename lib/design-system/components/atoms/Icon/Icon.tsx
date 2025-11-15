import { useColorScheme } from "@/hooks/use-color-scheme";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, ViewProps } from "react-native";
import { allIcons } from "../../../icons";
import { theme } from "../../../theme";
import { iconSize } from "../../../tokens";

export interface IconProps extends Omit<ViewProps, "style"> {
  name: keyof typeof allIcons;
  size?: keyof typeof iconSize | number;
  color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "tint";
  variant?: "monochrome" | "hierarchical" | "palette" | "multicolor";
  weight?:
    | "ultraLight"
    | "thin"
    | "light"
    | "regular"
    | "medium"
    | "semibold"
    | "bold"
    | "heavy"
    | "black";
  style?: ViewProps["style"];
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  color = "primary",
  variant = "monochrome",
  weight = "regular",
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  // Size calculation
  const calculatedSize = typeof size === "number" ? size : iconSize[size];

  // Color mapping
  const colorMap: Record<typeof color, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    tint: colors.tint,
  };

  const iconColor = colorMap[color];

  // Get the SF Symbol name from icon map
  const symbolName = allIcons[name];

  // iOS uses SF Symbols
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={symbolName as any}
        size={calculatedSize}
        tintColor={iconColor}
        type="monochrome"
        weight={weight}
        style={style}
        accessibilityLabel={`${name} icon`}
        accessibilityRole="image"
        {...props}
      />
    );
  }

  // Android/Web - For now, return a placeholder
  // TODO: Implement Material Icons for Android/Web
  return null;
};
