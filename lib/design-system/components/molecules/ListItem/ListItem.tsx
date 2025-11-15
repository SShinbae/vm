import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Pressable, StyleSheet, View, ViewProps } from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Divider } from "../../atoms/Divider";
import { Text } from "../../atoms/Text";

export interface ListItemProps extends Omit<ViewProps, "style"> {
  title: string;
  subtitle?: string;
  description?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  showDivider?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  leftElement,
  rightElement,
  onPress,
  disabled = false,
  showDivider = false,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const content = (
    <View style={styles.container}>
      <View
        style={[
          styles.itemContainer,
          {
            backgroundColor: colors.card,
            minHeight: 44,
          },
        ]}
        {...props}
      >
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}

        <View style={styles.content}>
          <Text
            variant="body"
            weight="medium"
            numberOfLines={1}
            color={disabled ? "tertiary" : "primary"}
          >
            {title}
          </Text>

          {subtitle && (
            <Text
              variant="caption"
              color="secondary"
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}

          {description && (
            <Text
              variant="caption"
              color="tertiary"
              numberOfLines={2}
              style={styles.description}
            >
              {description}
            </Text>
          )}
        </View>

        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>

      {showDivider && <Divider />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: pressed ? colors.tint + "10" : "transparent",
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  leftElement: {
    marginRight: tokens.spacing.md,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  subtitle: {
    marginTop: tokens.spacing.xxxs,
  },
  description: {
    marginTop: tokens.spacing.xxs,
  },
  rightElement: {
    marginLeft: tokens.spacing.md,
    justifyContent: "center",
  },
});
