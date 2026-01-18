import { Icon } from "@/lib/design-system/components/atoms/Icon";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter, router as staticRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { stylesheet } from "./PageHeader.styles";
import { PageHeaderProps } from "./PageHeader.types";

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions = [],
  rightContent,
  bottom,
  backgroundColor,
  noBorder = false,
}) => {
  const { styles, theme } = useStyles(stylesheet);
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      staticRouter.replace("/(tabs)");
    }
  };

  return (
    <View
      style={[
        styles.container,
        noBorder && styles.containerNoBorder,
        backgroundColor && { backgroundColor },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBack && (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <IconSymbol
                name="chevron.left"
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightContent
          ? rightContent
          : actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <Pressable
                    key={index}
                    onPress={action.onPress}
                    disabled={action.disabled}
                    style={[
                      styles.actionButton,
                      action.disabled && styles.actionButtonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={action.label || `Action ${index + 1}`}
                    accessibilityState={{ disabled: action.disabled }}
                  >
                    <Icon name={action.icon} size={24} color="primary" />
                  </Pressable>
                ))}
              </View>
            )}
      </View>

      {bottom && <View style={styles.bottomContainer}>{bottom}</View>}
    </View>
  );
};
