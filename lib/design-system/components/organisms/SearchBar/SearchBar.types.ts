import { allIcons } from "@/lib/design-system/icons";

export interface SearchBarProps {
  /**
   * Current search value
   */
  value: string;

  /**
   * Callback when search value changes
   */
  onChangeText: (text: string) => void;

  /**
   * Placeholder text
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Callback when search is submitted
   */
  onSearch?: (text: string) => void;

  /**
   * Show filter button
   * @default false
   */
  showFilter?: boolean;

  /**
   * Callback when filter button is pressed
   */
  onFilterPress?: () => void;

  /**
   * Show sort button
   * @default false
   */
  showSort?: boolean;

  /**
   * Callback when sort button is pressed
   */
  onSortPress?: () => void;

  /**
   * Number of active filters
   */
  activeFilters?: number;

  /**
   * Auto-focus the input on mount
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Show clear button when there's text
   * @default true
   */
  showClear?: boolean;

  /**
   * Custom left icon
   */
  leftIcon?: keyof typeof allIcons;

  /**
   * Full width
   * @default true
   */
  fullWidth?: boolean;
}
