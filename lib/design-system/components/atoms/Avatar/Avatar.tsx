import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Badge } from "../Badge";
import { Text } from "../Text";

export interface AvatarProps extends Omit<ViewProps, "style"> {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  source?: ImageSourcePropType;
  name?: string;
  alt?: string;
  status?: "online" | "offline" | "busy" | "away";
  showStatus?: boolean;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewProps["style"];
}

export const Avatar: React.FC<AvatarProps> = ({
  size = "md",
  source,
  name,
  alt,
  status,
  showStatus = false,
  backgroundColor,
  textColor,
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  // Size mapping
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 96,
  };

  const avatarSize = sizeMap[size];
  const borderRadius = avatarSize / 2;

  // Font size for initials
  const fontSizeMap = {
    xs: tokens.fontSize.xxxs,
    sm: tokens.fontSize.xxs,
    md: tokens.fontSize.sm,
    lg: tokens.fontSize.base,
    xl: tokens.fontSize.lg,
    xxl: tokens.fontSize.xxl,
  };

  const fontSize = fontSizeMap[size];

  // Get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initials = getInitials(name);

  // Background color for fallback
  const bgColor = backgroundColor || colors.tint;
  const txtColor = textColor || "#FFFFFF";

  const statusSize = avatarSize * 0.25;
  const statusPosition = avatarSize * 0.75;

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={alt || name || "Avatar"}
      {...props}
    >
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
            },
          ]}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text
            variant="label"
            weight="semibold"
            style={{
              fontSize,
              color: txtColor,
            }}
          >
            {initials}
          </Text>
        </View>
      )}

      {showStatus && status && (
        <View
          style={[
            styles.statusContainer,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              top: statusPosition,
              left: statusPosition,
              borderWidth: 2,
              borderColor: colors.background,
            },
          ]}
        >
          <Badge
            variant={
              status === "online"
                ? "success"
                : status === "busy"
                  ? "error"
                  : status === "away"
                    ? "warning"
                    : "default"
            }
            type="dot"
            size="sm"
            style={{
              width: statusSize - 4,
              height: statusSize - 4,
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "flex-start",
  },
  image: {
    resizeMode: "cover",
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
