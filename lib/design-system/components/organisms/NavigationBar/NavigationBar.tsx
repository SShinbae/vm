import { useColorScheme } from '@/hooks/use-color-scheme';
import { Badge } from '@/lib/design-system/components/atoms/Badge';
import { Icon } from '@/lib/design-system/components/atoms/Icon';
import { Text } from '@/lib/design-system/components/atoms/Text';
import { theme } from '@/lib/design-system/theme';
import { tokens } from '@/lib/design-system/tokens';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationBarProps } from './NavigationBar.types';

export const NavigationBar: React.FC<NavigationBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  showLabels = true,
  variant = 'default',
  position = 'bottom',
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  return (
    <View
      style={[
        styles.container,
        variant === 'filled' && { backgroundColor: colors.card },
        variant === 'default' && { backgroundColor: colors.background, borderTopColor: colors.border },
        position === 'top' && styles.topPosition,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled;

        return (
          <Pressable
            key={tab.id}
            onPress={() => !isDisabled && onTabChange(tab.id)}
            style={[
              styles.tab,
              isActive && variant === 'filled' && { backgroundColor: colors.tint + '20' },
            ]}
            disabled={isDisabled}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive, disabled: isDisabled }}
          >
            <View style={styles.tabContent}>
              {tab.icon && (
                <>
                  <View style={styles.iconContainer}>
                    <Icon
                      name={tab.icon}
                      size="md"
                      color={isActive ? 'primary' : isDisabled ? 'tertiary' : 'secondary'}
                    />
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <View style={styles.badgeContainer}>
                        <Badge count={tab.badge} size="sm" />
                      </View>
                    )}
                  </View>
                  {showLabels && <View style={styles.labelSpacer} />}
                </>
              )}
              {showLabels && (
                <Text
                  variant="body"
                  size="xs"
                  weight={isActive ? 'semibold' : 'regular'}
                  color={isActive ? 'primary' : isDisabled ? 'tertiary' : 'secondary'}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  topPosition: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.xxs,
    borderRadius: tokens.radius.md,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -12,
  },
  labelSpacer: {
    height: 4,
  },
});
