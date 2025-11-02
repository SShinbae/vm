import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Spacer } from '../../atoms/Spacer';
import { PageHeader } from '../../organisms/PageHeader';
import type { DashboardLayoutProps } from './DashboardLayout.types';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  metrics,
  charts,
  quickActions,
  recentActivity,
  customSections = [],
  loading = false,
  refreshable = true,
  onRefresh,
  refreshing = false,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const sections = [
    { key: 'metrics', content: metrics },
    { key: 'quickActions', content: quickActions },
    { key: 'charts', content: charts },
    { key: 'recentActivity', content: recentActivity },
    ...customSections.map((section, index) => ({
      key: `custom-${index}`,
      content: section,
    })),
  ].filter((section) => section.content);

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
        {sections.map((section, index) => (
          <React.Fragment key={section.key}>
            <View style={styles.section}>{section.content}</View>
            {index < sections.length - 1 && <Spacer size="xl" />}
          </React.Fragment>
        ))}
      </ScrollView>
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
});
