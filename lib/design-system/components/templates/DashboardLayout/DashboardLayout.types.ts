import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import type { PageHeaderProps } from '../../organisms/PageHeader/PageHeader.types';

export interface DashboardLayoutProps extends Omit<ViewProps, 'style'> {
  /**
   * Page header configuration
   */
  header: PageHeaderProps;

  /**
   * Metric cards section
   */
  metrics?: ReactNode;

  /**
   * Charts and graphs section
   */
  charts?: ReactNode;

  /**
   * Quick action buttons section
   */
  quickActions?: ReactNode;

  /**
   * Recent activity or updates section
   */
  recentActivity?: ReactNode;

  /**
   * Additional custom sections
   */
  customSections?: ReactNode[];

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Whether to enable pull-to-refresh
   * @default true
   */
  refreshable?: boolean;

  /**
   * Pull-to-refresh handler
   */
  onRefresh?: () => void;

  /**
   * Whether currently refreshing
   * @default false
   */
  refreshing?: boolean;
}
