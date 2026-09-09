import { LineChart } from "@/components/charts/LineChart";
import type { TrendDataPoint } from "@/types/analytics";

interface TrendLineChartProps {
  data: TrendDataPoint[];
  title: string;
  yAxisLabel?: string;
  height?: number;
  color?: string;
}

export function TrendLineChart({
  data,
  title,
  yAxisLabel = "",
  height = 220,
  color,
}: TrendLineChartProps) {
  return (
    <LineChart
      data={data.map(({ date, label, value }) => ({
        x: date,
        y: value,
        label: label || date.slice(5, 10),
      }))}
      title={title}
      height={height}
      color={color}
      formatY={(value) => `${yAxisLabel}${value.toFixed(1)}`}
    />
  );
}
