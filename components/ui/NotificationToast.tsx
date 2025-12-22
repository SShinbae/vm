import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/use-theme-color";
import { NotificationData } from "../../lib/services/notificationService";

const { width: screenWidth } = Dimensions.get("window");
const TOAST_WIDTH = screenWidth - 32;
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

  const backgroundColor = String(useThemeColor({}, "card"));
  const textColor = String(useThemeColor({}, "text"));
  const borderColor = String(useThemeColor({}, "border"));

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
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
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
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
        className="rounded-lg shadow-lg"
        style={{
          backgroundColor,
          borderWidth: 1,
          borderColor,
        }}
      >
        <View className="p-4">
          <View className="flex-row items-start">
            <View className="mr-3 mt-1">
              <Ionicons name={getIcon() as any} size={24} color={textColor} />
            </View>

            <View className="flex-1">
              <Text
                className="font-semibold text-base mb-1"
                style={{ color: textColor }}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              <Text
                className="text-sm"
                style={{ color: textColor, opacity: 0.8 }}
                numberOfLines={2}
              >
                {notification.body}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDismiss}
              className="p-1 ml-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-outline"
                size={20}
                color={textColor}
                style={{ opacity: 0.6 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
