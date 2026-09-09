import { Ionicons } from "@expo/vector-icons";
import { baseColors, spacing } from "@/src/design-system";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NotificationData } from "../../lib/services/notificationService";

const ANIMATION_DURATION = 300;
const AUTO_DISMISS_DURATION = 4000;

interface NotificationToastProps {
  notification: NotificationData | null;
  visible: boolean;
  onDismiss: () => void;
  onPress?: (notification: NotificationData) => void;
}

export function NotificationToast({
  notification,
  visible,
  onDismiss,
  onPress,
}: NotificationToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const { styles, theme } = useStyles(stylesheet);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: reduceMotion ? 0 : ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: reduceMotion ? 0 : ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  useEffect(() => {
    if (visible && notification) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduceMotion ? 0 : ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduceMotion ? 0 : ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DURATION);
    } else {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, notification]);

  const handlePress = () => {
    if (notification) {
      onPress?.(notification);
    }
    handleDismiss();
  };

  const getIcon = () => {
    if (!notification) return "notifications-outline";

    switch (notification.notification_type) {
      case "mileage_log":
        return "speedometer-outline";
      case "fuel_log":
        return "car-outline";
      case "service_log":
        return "construct-outline";
      case "group_member":
        return "people-outline";
      case "group_invite":
        return "mail-outline";
      default:
        return "notifications-outline";
    }
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 40,
        left: 16,
        right: 16,
        zIndex: 1000,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.toast}
        accessibilityRole="button"
      >
        <View style={styles.padding}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons
                name={getIcon() as any}
                size={24}
                color={theme.colors.text}
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {notification.body}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.close}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
            >
              <Ionicons
                name="close-outline"
                size={20}
                color={theme.colors.text}
                style={{ opacity: 0.6 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  toast: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    shadowColor: baseColors.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  padding: { padding: theme.spacing.lg },
  row: { flexDirection: "row", alignItems: "flex-start" },
  icon: { marginRight: theme.spacing.md, marginTop: theme.spacing.xs },
  content: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  body: { color: theme.colors.text, opacity: 0.8, fontSize: theme.fontSize.sm },
  close: { marginLeft: theme.spacing.sm, padding: theme.spacing.xs },
}));
