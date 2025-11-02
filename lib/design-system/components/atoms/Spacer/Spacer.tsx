import React from 'react';
import { View, ViewProps } from 'react-native';
import { tokens } from '../../../tokens';

export interface SpacerProps extends Omit<ViewProps, 'style'> {
  size?: keyof typeof tokens.spacing;
  horizontal?: boolean;
  style?: ViewProps['style'];
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  horizontal = false,
  style,
  ...props
}) => {
  const spacingValue = tokens.spacing[size];

  return (
    <View
      style={[
        {
          width: horizontal ? spacingValue : undefined,
          height: horizontal ? undefined : spacingValue,
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
      {...props}
    />
  );
};
