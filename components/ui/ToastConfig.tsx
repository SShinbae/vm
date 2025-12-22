import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ToastConfig } from "react-native-toast-message";

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

const TOAST_CONFIG: Record<
  ToastType,
  {
    iconName: keyof typeof Ionicons.glyphMap;
    lightBg: string;
    lightBorder: string;
    lightIcon: string;
    darkBg: string;
    darkBorder: string;
    darkIcon: string;
  }
> = {
  success: {
    iconName: "checkmark-circle",
    lightBg: "#ECFDF5",
    lightBorder: "#10B981",
    lightIcon: "#10B981",
    darkBg: "#064E3B",
    darkBorder: "#10B981",
    darkIcon: "#34D399",
  },
  error: {
    iconName: "close-circle",
    lightBg: "#FEF2F2",
    lightBorder: "#EF4444",
    lightIcon: "#EF4444",
    darkBg: "#7F1D1D",
    darkBorder: "#EF4444",
    darkIcon: "#F87171",
  },
  warning: {
    iconName: "warning",
    lightBg: "#FFFBEB",
    lightBorder: "#F59E0B",
    lightIcon: "#F59E0B",
    darkBg: "#78350F",
    darkBorder: "#F59E0B",
    darkIcon: "#FBBF24",
  },
  info: {
    iconName: "information-circle",
    lightBg: "#EFF6FF",
    lightBorder: "#3B82F6",
    lightIcon: "#3B82F6",
    darkBg: "#1E3A5F",
    darkBorder: "#3B82F6",
    darkIcon: "#60A5FA",
  },
};

function CustomToast({ type, props }: { type: ToastType; props: ToastProps }) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const config = TOAST_CONFIG[type];

  const backgroundColor = isDark ? config.darkBg : config.lightBg;
  const borderColor = isDark ? config.darkBorder : config.lightBorder;
  const iconColor = isDark ? config.darkIcon : config.lightIcon;
  const textColor = isDark ? "#F9FAFB" : "#1F2937";
  const secondaryTextColor = isDark ? "#D1D5DB" : "#6B7280";

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
          borderLeftColor: borderColor,
          width: toastWidth,
          marginTop: Platform.OS === "web" ? 60 : insets.top + 8,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={config.iconName} size={24} color={iconColor} />
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
            style={[styles.actionButton, { borderColor }]}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={iconColor}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.actionText, { color: iconColor }]}>Retry</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
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
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
