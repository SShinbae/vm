import type { ComponentProps } from "react";
import { Text } from "react-native";
import { useStyles } from "react-native-unistyles";

type Props = ComponentProps<typeof Text> & {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?: "primary" | "secondary" | "error";
};

export function ThemedText({
  size = "md",
  weight = "regular",
  color = "primary",
  style,
  ...props
}: Props) {
  const { theme } = useStyles();
  const fontSizes = {
    xs: theme.fontSize.xs,
    sm: theme.fontSize.sm,
    md: theme.fontSize.base,
    lg: theme.fontSize.lg,
    xl: theme.fontSize.xl,
  };
  const colors = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    error: theme.colors.error,
  };
  const fontWeights = {
    regular: theme.fontWeight.normal,
    medium: theme.fontWeight.medium,
    semibold: theme.fontWeight.semibold,
    bold: theme.fontWeight.bold,
  };

  return (
    <Text
      {...props}
      style={[
        {
          color: colors[color],
          fontSize: fontSizes[size],
          fontWeight: fontWeights[weight],
        },
        style,
      ]}
    />
  );
}
