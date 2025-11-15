import { useColorScheme } from "@/hooks/use-color-scheme";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { theme } from "@/lib/design-system/theme";
import { tokens } from "@/lib/design-system/tokens";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { DataTableProps } from "./DataTable.types";

export const DataTable = <T,>({
  data,
  columns,
  onRowPress,
  loading = false,
  emptyMessage = "No data available",
  emptyState,
  showHeader = true,
  striped = false,
  keyExtractor,
}: DataTableProps<T>) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const getKey = (item: T, index: number) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    if (typeof item === "object" && item !== null && "id" in item) {
      return String((item as any).id);
    }
    return String(index);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        {emptyState || (
          <Text variant="body" size="md" color="secondary">
            {emptyMessage}
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* Header */}
        {showHeader && (
          <View
            style={[
              styles.row,
              styles.headerRow,
              { borderBottomColor: colors.border },
            ]}
          >
            {columns.map((column, index) => (
              <View
                key={index}
                style={[
                  styles.cell,
                  styles.headerCell,
                  column.width ? { width: column.width } : null,
                ]}
              >
                <Text variant="body" size="sm" weight="semibold">
                  {column.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Data Rows */}
        {data.map((item, rowIndex) => (
          <Pressable
            key={getKey(item, rowIndex)}
            onPress={onRowPress ? () => onRowPress(item, rowIndex) : undefined}
            style={[
              styles.row,
              styles.dataRow,
              striped &&
                rowIndex % 2 === 1 && { backgroundColor: colors.surface },
              { borderBottomColor: colors.border },
            ]}
            disabled={!onRowPress}
          >
            {columns.map((column, colIndex) => {
              const value =
                typeof column.key === "string" && column.key in (item as object)
                  ? (item as any)[column.key]
                  : undefined;

              return (
                <View
                  key={colIndex}
                  style={[
                    styles.cell,
                    styles.dataCell,
                    column.width ? { width: column.width } : null,
                  ]}
                >
                  {column.render ? (
                    column.render(value, item, rowIndex)
                  ) : (
                    <Text variant="body" size="sm" numberOfLines={2}>
                      {value !== null && value !== undefined
                        ? String(value)
                        : "-"}
                    </Text>
                  )}
                </View>
              );
            })}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    paddingHorizontal: tokens.spacing.lg,
  },
  table: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  headerRow: {
    backgroundColor: "transparent",
  },
  dataRow: {
    backgroundColor: "transparent",
  },
  cell: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    justifyContent: "center",
    minWidth: 120,
  },
  headerCell: {
    paddingVertical: tokens.spacing.md,
  },
  dataCell: {
    // default styling
  },
});
