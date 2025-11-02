import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import type { PageHeaderProps } from '../../organisms/PageHeader/PageHeader.types';

export interface DetailTab {
  /**
   * Unique tab identifier
   */
  id: string;

  /**
   * Tab label
   */
  label: string;

  /**
   * Tab content
   */
  content: ReactNode;

  /**
   * Badge count
   */
  badge?: number;
}

export interface DetailLayoutProps extends Omit<ViewProps, 'style'> {
  /**
   * Page header configuration
   */
  header: PageHeaderProps;

  /**
   * Hero section (e.g., vehicle image, primary info)
   */
  hero?: ReactNode;

  /**
   * Tabs configuration
   */
  tabs?: DetailTab[];

  /**
   * Currently active tab ID
   */
  activeTab?: string;

  /**
   * Tab change handler
   */
  onTabChange?: (tabId: string) => void;

  /**
   * Related items section
   */
  relatedItems?: ReactNode;

  /**
   * Bottom action buttons
   */
  actions?: ReactNode;

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
