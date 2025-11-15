import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Pressable, StyleSheet, View, ViewProps } from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Icon } from "../../atoms/Icon";
import { Text } from "../../atoms/Text";
import { Button } from "../Button";

export interface AlertProps extends Omit<ViewProps, "style"> {
  severity?: "success" | "warning" | "error" | "info";
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Alert: React.FC<AlertProps> = ({
  severity = "info",
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const severityConfig = {
    success: {
      backgroundColor: colors.success + "15",
      borderColor: colors.success,
      iconColor: "success" as const,
      icon: "success" as const,
      textColor: "success" as const,
    },
    warning: {
      backgroundColor: colors.warning + "15",
      borderColor: colors.warning,
      iconColor: "warning" as const,
      icon: "warning" as const,
      textColor: "warning" as const,
    },
    error: {
      backgroundColor: colors.error + "15",
      borderColor: colors.error,
      iconColor: "error" as const,
      icon: "error" as const,
      textColor: "error" as const,
    },
    info: {
      backgroundColor: colors.info + "15",
      borderColor: colors.info,
      iconColor: "info" as const,
      icon: "info" as const,
      textColor: "info" as const,
    },
  };

  const config = severityConfig[severity];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderLeftWidth: 4,
          borderLeftColor: config.borderColor,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.md,
        },
      ]}
      accessibilityRole="alert"
      {...props}
    >
      <View style={styles.content}>
        <Icon
          name={config.icon}
          size="md"
          color={config.iconColor}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          {title && (
            <Text
              variant="body"
              weight="semibold"
              color={config.textColor}
              style={styles.title}
            >
              {title}
            </Text>
          )}

          <Text variant="body" color={config.textColor}>
            {message}
          </Text>

          {action && (
            <Button
              variant="ghost"
              size="sm"
              onPress={action.onPress}
              style={styles.action}
            >
              {action.label}
            </Button>
          )}
        </View>

        {dismissible && onDismiss && (
          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss alert"
            hitSlop={8}
          >
            <Icon name="close" size="sm" color={config.iconColor} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: tokens.spacing.sm,
    marginTop: tokens.spacing.xxxs,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: tokens.spacing.xxs,
  },
  action: {
    marginTop: tokens.spacing.sm,
    alignSelf: "flex-start",
  },
  dismissButton: {
    marginLeft: tokens.spacing.sm,
    padding: tokens.spacing.xxxs,
  },
});
