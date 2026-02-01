/**
 * Chart-specific types for Victory Native charts
 * Used for cost visualization in analytics
 */

// ============================================================================
// Chart Configuration Types
// ============================================================================

export interface VictoryChartConfig {
  width: number;
  height: number;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

export interface ChartTheme {
  fuelColor: string;
  serviceColor: string;
  totalColor: string;
  gridColor: string;
  axisColor: string;
  labelColor: string;
  backgroundColor: string;
}

// ============================================================================
// Line Chart Types
// ============================================================================

export interface LineChartDataPoint {
  x: string | number;
  y: number;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  color?: string;
  strokeWidth?: number;
  showPoints?: boolean;
  animate?: boolean;
}

// ============================================================================
// Bar Chart Types
// ============================================================================

export interface BarChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  color?: string;
  barWidth?: number;
  cornerRadius?: number;
}

export interface StackedBarChartData {
  x: string | number;
  fuel: number;
  service: number;
}

export interface StackedBarChartProps {
  data: StackedBarChartData[];
  colors?: {
    fuel: string;
    service: string;
  };
}

// ============================================================================
// Area Chart Types
// ============================================================================

export interface AreaChartDataPoint {
  x: string | number;
  y: number;
  y0?: number;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

// ============================================================================
// Pie Chart Types
// ============================================================================

export interface PieChartDataPoint {
  x: string;
  y: number;
  label?: string;
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  colorScale?: string[];
  innerRadius?: number;
  labelRadius?: number;
  showLabels?: boolean;
}

// ============================================================================
// Tooltip Types
// ============================================================================

export interface ChartTooltipData {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

// ============================================================================
// Legend Types
// ============================================================================

export interface LegendItem {
  name: string;
  color: string;
  value?: number | string;
}

export interface ChartLegendProps {
  items: LegendItem[];
  orientation?: "horizontal" | "vertical";
  position?: "top" | "bottom" | "left" | "right";
}

// ============================================================================
// Generic Chart Types
// ============================================================================

export interface ChartDimensions {
  width: number;
  height: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartAnimationConfig {
  duration?: number;
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
}
