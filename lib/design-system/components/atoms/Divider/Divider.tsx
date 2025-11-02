import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Text } from '../Text';

export interface DividerProps extends Omit<ViewProps, 'style'> {
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: 'default' | 'light' | 'dark';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
  spacing?: keyof typeof tokens.spacing;
  style?: ViewProps['style'];
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 'thin',
  color = 'default',
  label,
  labelPosition = 'center',
  spacing = 'md',
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  // Thickness mapping
  const thicknessMap = {
    thin: 1,
    medium: 2,
    thick: 4,
  };

  const lineThickness = thicknessMap[thickness];

  // Color mapping
  const colorMap = {
    default: colors.border,
    light: colors.border + '40', // 25% opacity
    dark: colors.text,
  };

  const lineColor = colorMap[color];

  // Spacing
  const spacingValue = tokens.spacing[spacing];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.verticalContainer,
          {
            width: lineThickness,
            backgroundColor: lineColor,
            marginHorizontal: spacingValue,
          },
          style,
        ]}
        accessibilityRole="none"
        {...props}
      />
    );
  }

  // Horizontal divider with optional label
  if (label) {
    return (
      <View
        style={[
          styles.horizontalWithLabel,
          {
            marginVertical: spacingValue,
          },
          style,
        ]}
        accessibilityRole="none"
        accessibilityLabel={label}
        {...props}
      >
        {labelPosition !== 'right' && (
          <View
            style={[
              styles.line,
              {
                height: lineThickness,
                backgroundColor: lineColor,
                flex: labelPosition === 'left' ? 0.1 : 1,
              },
            ]}
          />
        )}
        <Text
          variant="caption"
          color="secondary"
          style={{ marginHorizontal: tokens.spacing.sm }}
        >
          {label}
        </Text>
        {labelPosition !== 'left' && (
          <View
            style={[
              styles.line,
              {
                height: lineThickness,
                backgroundColor: lineColor,
                flex: labelPosition === 'right' ? 0.1 : 1,
              },
            ]}
          />
        )}
      </View>
    );
  }

  // Simple horizontal divider
  return (
    <View
      style={[
        styles.horizontal,
        {
          height: lineThickness,
          backgroundColor: lineColor,
          marginVertical: spacingValue,
        },
        style,
      ]}
      accessibilityRole="none"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  verticalContainer: {
    alignSelf: 'stretch',
  },
  horizontalWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    alignSelf: 'stretch',
  },
});
