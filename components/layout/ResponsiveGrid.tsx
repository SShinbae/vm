import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

interface ResponsiveGridProps {
  children: React.ReactNode[];
  spacing?: number;
  minItemWidth?: number;
}

export function ResponsiveGrid({
  children,
  spacing = 16,
  minItemWidth = 300
}: ResponsiveGridProps) {
  const layout = useResponsiveLayout();

  // Calculate optimal columns based on available width
  const availableWidth = layout.screenWidth - (layout.contentPadding * 2);
  const itemsPerRow = Math.max(1, Math.floor((availableWidth + spacing) / (minItemWidth + spacing)));
  const actualColumns = Math.min(itemsPerRow, children.length);

  // For mobile, always use single column
  const columns = layout.isMobile ? 1 : actualColumns;

  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < children.length; i += columns) {
      const rowItems = children.slice(i, i + columns);

      rows.push(
        <View key={i} style={[styles.row, { marginBottom: spacing }]}>
          {rowItems.map((child, index) => (
            <View
              key={index}
              style={[
                styles.gridItem,
                {
                  flex: 1,
                  marginRight: index < rowItems.length - 1 ? spacing : 0,
                }
              ]}
            >
              {child}
            </View>
          ))}
          {/* Fill remaining space if last row is incomplete */}
          {rowItems.length < columns &&
            Array.from({ length: columns - rowItems.length }).map((_, index) => (
              <View
                key={`spacer-${index}`}
                style={[
                  styles.gridItem,
                  {
                    flex: 1,
                    marginRight: index < columns - rowItems.length - 1 ? spacing : 0
                  }
                ]}
              />
            ))
          }
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      {renderRows()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gridItem: {
    // Base styles - content will determine height
  },
});