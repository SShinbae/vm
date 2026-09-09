import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ToastConfig } from "react-native-toast-message";
import { useStyles } from "react-native-unistyles";
import { baseColors, withOpacity, spacing } from "@/src/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  props?: {
    onRetry?: () => void;
    onDismiss?: () => void;
  };
  hide?: () => void;
}

type ToastType = "success" | "error" | "warning" | "info";

const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  warning: "warning",
  info: "information-circle",
};

function CustomToast({ type, props }: { type: ToastType; props: ToastProps }) {
  const { theme } = useStyles();
  const insets = useSafeAreaInsets();
  const statusColor = theme.colors[type];
  const backgroundColor = withOpacity(statusColor, 0.12);
  const textColor = theme.colors.text;
  const secondaryTextColor = theme.colors.textSecondary;

  const toastWidth =
    Platform.OS === "web"
      ? Math.min(SCREEN_WIDTH - 32, 400)
      : SCREEN_WIDTH - 32;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderLeftColor: statusColor,
          width: toastWidth,
          marginTop: Platform.OS === "web" ? 60 : insets.top + 8,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={TOAST_ICONS[type]} size={24} color={statusColor} />
        </View>
        <View style={styles.textContainer}>
          {props.text1 && (
            <Text
              style={[styles.title, { color: textColor }]}
              numberOfLines={2}
            >
              {props.text1}
            </Text>
          )}
          {props.text2 && (
            <Text
              style={[styles.message, { color: secondaryTextColor }]}
              numberOfLines={3}
            >
              {props.text2}
            </Text>
          )}
        </View>
        <Pressable
          onPress={props.hide}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={secondaryTextColor} />
        </Pressable>
      </View>
      {props.props?.onRetry && (
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => {
              props.props?.onRetry?.();
              props.hide?.();
            }}
            style={[styles.actionButton, { borderColor: statusColor }]}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={statusColor}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={[styles.actionText, { color: statusColor }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <CustomToast type="success" props={props} />,
  error: (props) => <CustomToast type="error" props={props} />,
  warning: (props) => <CustomToast type="warning" props={props} />,
  info: (props) => <CustomToast type="info" props={props} />,
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: baseColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: withOpacity(baseColors.black, 0.1),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
