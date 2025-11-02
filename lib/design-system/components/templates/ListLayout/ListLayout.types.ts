import type { ReactNode } from 'react';
import type { ListRenderItem, ViewProps } from 'react-native';
import type { PageHeaderProps } from '../../organisms/PageHeader/PageHeader.types';

export interface ListLayoutProps<T> extends Omit<ViewProps, 'style'> {
  /**
   * Page header configuration
   */
  header?: PageHeaderProps;

  /**
   * Search query value
   */
  searchQuery?: string;

  /**
   * Search change handler
   */
  onSearchChange?: (query: string) => void;

  /**
   * Filter press handler
   */
  onFilterPress?: () => void;

  /**
   * Sort press handler
   */
  onSortPress?: () => void;

  /**
   * Number of active filters
   */
  activeFilters?: number;

  /**
   * List data
   */
  data: T[];

  /**
   * Render item function
   */
  renderItem: ListRenderItem<T>;

  /**
   * Key extractor
   */
  keyExtractor?: (item: T, index: number) => string;

  /**
   * Empty state component
   */
  emptyComponent?: ReactNode;

  /**
   * Empty state message
   */
  emptyMessage?: string;

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

  /**
   * Load more handler (infinite scroll)
   */
  onLoadMore?: () => void;

  /**
   * Whether currently loading more
   * @default false
   */
  loadingMore?: boolean;

  /**
   * Whether all items have been loaded
   * @default false
   */
  hasMore?: boolean;

  /**
   * List header component
   */
  listHeader?: ReactNode;

  /**
   * List footer component
   */
  listFooter?: ReactNode;

  /**
   * Item separator component
   */
  itemSeparator?: ReactNode;
}
