import { DimensionValue } from "react-native";

export interface DataTableColumn<T = any> {
  key: keyof T | string;
  title: string;
  width?: DimensionValue;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  /**
   * Table data
   */
  data: T[];

  /**
   * Column configuration
   */
  columns: DataTableColumn<T>[];

  /**
   * Row press callback
   */
  onRowPress?: (item: T, index: number) => void;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Empty state component
   */
  emptyState?: React.ReactNode;

  /**
   * Show header
   * @default true
   */
  showHeader?: boolean;

  /**
   * Striped rows
   * @default false
   */
  striped?: boolean;

  /**
   * Key extractor function
   */
  keyExtractor?: (item: T, index: number) => string;
}
