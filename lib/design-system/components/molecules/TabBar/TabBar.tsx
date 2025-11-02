import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { allIcons } from '../../../icons';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Badge } from '../../atoms/Badge';
import { Icon } from '../../atoms/Icon';
import { Text } from '../../atoms/Text';

export interface Tab {
  key: string;
  label: string;
  icon?: keyof typeof allIcons;
  badge?: number;
  disabled?: boolean;
}

export interface TabBarProps extends Omit<ViewProps, 'style'> {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  variant?: 'default' | 'underline' | 'pills';
  scrollable?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  scrollable = false,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const renderTab = (tab: Tab) => {
    const isActive = activeTab === tab.key;
    const isDisabled = tab.disabled || false;

    const variantStyles = {
      default: {
        container: {
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          backgroundColor: isActive ? colors.tint + '15' : 'transparent',
          borderRadius: 0,
        },
        text: isActive ? colors.tint : colors.textSecondary,
      },
      underline: {
        container: {
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          backgroundColor: 'transparent',
          borderBottomWidth: 2,
          borderBottomColor: isActive ? colors.tint : 'transparent',
          borderRadius: 0,
        },
        text: isActive ? colors.tint : colors.textSecondary,
      },
      pills: {
        container: {
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.xs,
          backgroundColor: isActive ? colors.tint : colors.card,
          borderRadius: tokens.radius.full,
          marginHorizontal: tokens.spacing.xxs,
        },
        text: isActive ? '#FFFFFF' : colors.textSecondary,
      },
    };

    const style = variantStyles[variant];

    return (
      <Pressable
        key={tab.key}
        onPress={() => !isDisabled && onTabChange(tab.key)}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.tab,
          style.container,
          {
            opacity: isDisabled ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled: isDisabled }}
        accessibilityLabel={tab.label}
      >
        <View style={styles.tabContent}>
          {tab.icon && (
            <Icon
              name={tab.icon}
              size="sm"
              color={isActive ? 'tint' : 'secondary'}
              style={styles.tabIcon}
            />
          )}

          <Text
            variant="label"
            weight={isActive ? 'semibold' : 'medium'}
            style={{
              color: style.text,
            }}
          >
            {tab.label}
          </Text>

          {tab.badge !== undefined && tab.badge > 0 && (
            <Badge
              count={tab.badge}
              variant="error"
              size="sm"
              style={styles.badge}
            />
          )}
        </View>
      </Pressable>
    );
  };

  const tabsContent = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomWidth: variant === 'underline' ? 1 : 0,
          borderBottomColor: colors.border,
        },
      ]}
      {...props}
    >
      {tabs.map(renderTab)}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {tabsContent}
      </ScrollView>
    );
  }

  return tabsContent;
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: tokens.spacing.xs,
  },
  badge: {
    marginLeft: tokens.spacing.xs,
  },
});
