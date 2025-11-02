import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Badge } from '../../atoms/Badge';
import { Spacer } from '../../atoms/Spacer';
import { Text } from '../../atoms/Text';
import { PageHeader } from '../../organisms/PageHeader';
import type { DetailLayoutProps } from './DetailLayout.types';

export const DetailLayout: React.FC<DetailLayoutProps> = ({
  header,
  hero,
  tabs = [],
  activeTab: controlledActiveTab,
  onTabChange,
  relatedItems,
  actions,
  loading = false,
  refreshable = true,
  onRefresh,
  refreshing = false,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id);
  const activeTab = controlledActiveTab || internalActiveTab;

  const handleTabPress = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} {...props}>
      <PageHeader {...header} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          refreshable && onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          ) : undefined
        }
      >
        {/* Hero Section */}
        {hero && (
          <>
            <View style={styles.section}>{hero}</View>
            <Spacer size="lg" />
          </>
        )}

        {/* Tabs */}
        {tabs.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
              contentContainerStyle={styles.tabsContent}
            >
              {tabs.map((tab, index) => {
                const isActive = tab.id === activeTab;
                return (
                  <React.Fragment key={tab.id}>
                    <TouchableOpacity
                      style={[
                        styles.tab,
                        {
                          borderBottomColor: isActive ? colors.tint : 'transparent',
                        },
                      ]}
                      onPress={() => handleTabPress(tab.id)}
                      accessibilityRole="tab"
                      accessibilityLabel={tab.label}
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text
                        weight={isActive ? 'semibold' : 'regular'}
                        color={isActive ? 'primary' : 'secondary'}
                      >
                        {tab.label}
                      </Text>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <>
                          <View style={styles.badgeSpacer} />
                          <Badge count={tab.badge} size="sm" />
                        </>
                      )}
                    </TouchableOpacity>
                    {index < tabs.length - 1 && <View style={styles.tabSpacer} />}
                  </React.Fragment>
                );
              })}
            </ScrollView>
            <Spacer size="md" />
          </>
        )}

        {/* Active Tab Content */}
        {activeTabContent && (
          <>
            <View style={styles.section}>{activeTabContent}</View>
            <Spacer size="lg" />
          </>
        )}

        {/* Related Items */}
        {relatedItems && (
          <>
            <View style={styles.section}>{relatedItems}</View>
            <Spacer size="lg" />
          </>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {actions && (
        <View
          style={[
            styles.actionsContainer,
            { borderTopColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          {actions}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: tokens.spacing.md,
  },
  section: {
    width: '100%',
  },
  tabsContainer: {
    flexGrow: 0,
    marginHorizontal: -tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
  },
  tabsContent: {
    paddingRight: tokens.spacing.md,
  },
  tab: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabSpacer: {
    width: tokens.spacing.lg,
  },
  badgeSpacer: {
    width: tokens.spacing.xs,
  },
  actionsContainer: {
    padding: tokens.spacing.md,
    borderTopWidth: 1,
  },
});
