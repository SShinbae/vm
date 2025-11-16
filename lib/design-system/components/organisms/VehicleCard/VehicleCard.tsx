import { useColorScheme } from "@/hooks/use-color-scheme";
import { Icon } from "@/lib/design-system/components/atoms/Icon";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { Card } from "@/lib/design-system/components/molecules/Card";
import { Chip } from "@/lib/design-system/components/molecules/Chip";
import { theme } from "@/lib/design-system/theme";
import { tokens } from "@/lib/design-system/tokens";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { VehicleCardProps } from "./VehicleCard.types";

export const VehicleCard: React.FC<VehicleCardProps> = ({
  name,
  subtitle,
  image,
  status,
  statusVariant = "info",
  metrics = [],
  actions = [],
  onPress,
  loading = false,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  if (loading) {
    return (
      <Card variant="outlined">
        <View
          style={[styles.loadingContainer, { backgroundColor: colors.surface }]}
        >
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      onPress={onPress && !disabled ? onPress : undefined}
    >
      {/* Vehicle Image */}
      {image && (
        <>
          <Image
            source={typeof image === "string" ? { uri: image } : image}
            style={styles.image}
            resizeMode="cover"
          />
          <Spacer size="md" />
        </>
      )}

      {/* Header with Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="heading" size="lg" weight="semibold" numberOfLines={1}>
            {name}
          </Text>
          {subtitle && (
            <>
              <Spacer size="xxs" />
              <Text
                variant="body"
                size="sm"
                color="secondary"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </>
          )}
        </View>
        {status && (
          <Chip
            label={status}
            variant="filled"
            size="sm"
            leftIcon={
              statusVariant === "success"
                ? "success"
                : statusVariant === "warning"
                  ? "warning"
                  : statusVariant === "error"
                    ? "error"
                    : "info"
            }
          />
        )}
      </View>

      {/* Metrics */}
      {metrics.length > 0 && (
        <>
          <Spacer size="md" />
          <View style={styles.metricsContainer}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metric}>
                {metric.icon && (
                  <>
                    <Icon name={metric.icon} size="sm" color="secondary" />
                    <Spacer size="xxs" horizontal />
                  </>
                )}
                <View>
                  <Text variant="body" size="xs" color="secondary">
                    {metric.label}
                  </Text>
                  <Text variant="body" size="md" weight="semibold">
                    {metric.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <>
          <Spacer size="md" />
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                style={[styles.actionButton, { borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Icon name={action.icon} size="sm" color="primary" />
                <Spacer size="xs" horizontal />
                <Text variant="body" size="sm" weight="medium">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: tokens.radius.md,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: tokens.radius.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.md,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
});
