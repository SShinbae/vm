import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { tokens } from "../../../tokens";
import type { PageHeaderProps } from "../../organisms/PageHeader/PageHeader.types";

export interface PageLayoutProps extends Omit<ViewProps, "style"> {
  /**
   * Page header configuration
   */
  header?: PageHeaderProps;

  /**
   * Main content of the page
   */
  children: ReactNode;

  /**
   * Footer content (e.g., action buttons, navigation)
   */
  footer?: ReactNode;

  /**
   * Whether the content should be scrollable
   * @default true
   */
  scrollable?: boolean;

  /**
   * Background color of the page
   */
  backgroundColor?: string;

  /**
   * Padding around the content
   * @default 'md'
   */
  padding?: keyof typeof tokens.spacing;

  /**
   * Whether to show a safe area view
   * @default true
   */
  safeArea?: boolean;

  /**
   * Whether to enable keyboard avoiding behavior
   * @default false
   */
  keyboardAware?: boolean;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Error state
   */
  error?: string | null;

  /**
   * Retry handler for error state
   */
  onRetry?: () => void;

  /**
   * Additional content styles
   */
  contentStyle?: ViewProps["style"];
}
