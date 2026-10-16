import React from "react";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function MobilePageHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
}) {
  const { theme } = useStyles();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale >= 1.3;
  return (
    <View style={{ paddingVertical: 16, gap: 4 }}>
      {onBack && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{
            minWidth: 48,
            minHeight: 48,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IconSymbol
            name="chevron.left"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={{ color: theme.colors.primary }}>Back</Text>
        </TouchableOpacity>
      )}
      <View
        style={{
          flexDirection: stacked ? "column" : "row",
          alignItems: stacked ? "stretch" : "center",
          gap: 12,
        }}
      >
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 4 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: theme.fontSize["2xl"],
              fontWeight: "700",
              color: theme.colors.text,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={{ color: theme.colors.textSecondary }}>
              {subtitle}
            </Text>
          )}
        </View>
        {action}
      </View>
    </View>
  );
}
