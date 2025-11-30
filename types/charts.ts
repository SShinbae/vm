/**
 * Chart-specific types for Victory Native charts
 * Used for cost visualization in analytics
 */

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

export interface LineChartProps {
  data: { x: string | number; y: number }[];
  color?: string;
  strokeWidth?: number;
  showPoints?: boolean;
  animate?: boolean;
}

export interface BarChartProps {
  data: { x: string | number; y: number; label?: string }[];
  color?: string;
  barWidth?: number;
  cornerRadius?: number;
}

export interface StackedBarChartProps {
  data: {
    x: string | number;
    fuel: number;
    service: number;
  }[];
  colors?: {
    fuel: string;
    service: string;
  };
}

export interface AreaChartProps {
  data: { x: string | number; y: number; y0?: number }[];
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

export interface PieChartProps {
  data: {
    x: string;
    y: number;
    label?: string;
  }[];
  colorScale?: string[];
  innerRadius?: number;
  labelRadius?: number;
  showLabels?: boolean;
}

export interface ChartTooltipData {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

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
