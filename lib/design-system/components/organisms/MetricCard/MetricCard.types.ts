import { allIcons } from "@/lib/design-system/icons";

export type TrendDirection = "up" | "down" | "neutral";

export interface MetricCardProps {
  /**
   * Metric label
   */
  label: string;

  /**
   * Main metric value
   */
  value: string | number;

  /**
   * Icon name
   */
  icon?: keyof typeof allIcons;

  /**
   * Trend direction
   */
  trend?: TrendDirection;

  /**
   * Trend value/percentage
   */
  trendValue?: string;

  /**
   * Comparison text (e.g., "vs last month")
   */
  comparison?: string;

  /**
   * Card variant
   */
  variant?: "default" | "success" | "warning" | "error" | "info";

  /**
   * Show loading skeleton
   * @default false
   */
  loading?: boolean;

  /**
   * Callback when card is pressed
   */
  onPress?: () => void;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
}
