import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export interface ResponsiveGridProps {
  children: React.ReactNode[];
  /** Number of columns (overrides responsive defaults) */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    largeDesktop?: number;
  };
  /** Spacing between grid items */
  spacing?: number;
  /** Minimum item width (auto-calculates columns) */
  minItemWidth?: number;
  /** Additional container style */
  style?: ViewStyle;
}

/**
 * ResponsiveGrid - 12-column responsive grid system
 *
 * Default columns:
 * - Mobile (<768px): 1 column
 * - Tablet (768-1024px): 2 columns
 * - Desktop (1024-1440px): 2 columns
 * - Large Desktop (>=1440px): 3 columns
 *
 * @example
 * <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </ResponsiveGrid>
 */
export function ResponsiveGrid({
  children,
  columns,
  spacing,
  minItemWidth,
  style,
}: ResponsiveGridProps) {
  const layout = useResponsiveLayout();

  // Use provided spacing or default from layout
  const gridSpacing = spacing ?? layout.gridGutter;

  // Determine columns based on breakpoint
  let numColumns: number;

  if (minItemWidth) {
    // Auto-calculate based on minItemWidth
    const availableWidth = layout.screenWidth - layout.contentPadding * 2;
    const itemsPerRow = Math.max(
      1,
      Math.floor((availableWidth + gridSpacing) / (minItemWidth + gridSpacing)),
    );
    numColumns = Math.min(itemsPerRow, children.length);
  } else if (columns) {
    // Use provided column configuration
    if (layout.isLargeDesktop && columns.largeDesktop) {
      numColumns = columns.largeDesktop;
    } else if (layout.isDesktop && columns.desktop) {
      numColumns = columns.desktop;
    } else if (layout.isTablet && columns.tablet) {
      numColumns = columns.tablet;
    } else if (layout.isMobile && columns.mobile) {
      numColumns = columns.mobile;
    } else {
      numColumns = layout.columns; // Fallback to layout default
    }
  } else {
    // Use responsive defaults from layout
    numColumns = layout.columns;
  }

  // Only force mobile to 1 column if not explicitly overridden
  if (layout.isMobile && !columns?.mobile) {
    numColumns = 1;
  }

  // For single column, render as vertical stack
  if (numColumns === 1) {
    return (
      <View style={[styles.container, style]}>
        {children.map((child, index) => (
          <View
            key={index}
            style={{
              marginBottom: index < children.length - 1 ? gridSpacing : 0,
            }}
          >
            {child}
          </View>
        ))}
      </View>
    );
  }

  // For multiple columns, render as grid
  const renderRows = () => {
    const rows: React.ReactElement[] = [];

    for (let i = 0; i < children.length; i += numColumns) {
      const rowItems = children.slice(i, i + numColumns);

      rows.push(
        <View key={i} style={[styles.row, { marginBottom: gridSpacing }]}>
          {rowItems.map((child, index) => (
            <View
              key={index}
              style={[
                styles.gridItem,
                {
                  flex: 1,
                  marginRight: index < rowItems.length - 1 ? gridSpacing : 0,
                },
              ]}
            >
              {child}
            </View>
          ))}
          {/* Fill remaining space if last row is incomplete */}
          {rowItems.length < numColumns &&
            Array.from({ length: numColumns - rowItems.length }).map(
              (_, index) => (
                <View
                  key={`spacer-${index}`}
                  style={[
                    styles.gridItem,
                    {
                      flex: 1,
                      marginRight:
                        index < numColumns - rowItems.length - 1
                          ? gridSpacing
                          : 0,
                    },
                  ]}
                />
              ),
            )}
        </View>,
      );
    }

    return rows;
  };

  return <View style={[styles.container, style]}>{renderRows()}</View>;
}

const styles = StyleSheet.create({
  container: {
    // Remove flex: 1 to prevent layout issues
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  gridItem: {
    // Base styles - content will determine height
  },
});
