import { router, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  rightContent,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: ReactNode;
}) {
  const navigation = useRouter();
  const { styles, theme } = useStyles(stylesheet);

  const goBack = () =>
    navigation.canGoBack() ? navigation.back() : router.replace("/(tabs)");

  return (
    <View style={styles.header}>
      {showBack && (
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconSymbol name="chevron.left" size={20} color={theme.colors.text} />
        </Pressable>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightContent}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  titleContainer: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
}));
