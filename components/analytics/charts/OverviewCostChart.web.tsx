import React, { useMemo } from "react";
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useStyles } from "react-native-unistyles";
import type { CostChartDataPoint } from "../../../types/analytics";

export function OverviewCostChart({
  data,
  previous,
  height = 280,
}: {
  data: CostChartDataPoint[];
  previous?: CostChartDataPoint[];
  height?: number;
}) {
  const { theme } = useStyles();
  const rows = useMemo(
    () =>
      data.map((d, i) => ({ ...d, previousTotal: previous?.[i]?.totalCost })),
    [data, previous],
  );
  if (rows.length === 0) return null;
  return (
    <div
      style={{ width: "100%", height }}
      role="img"
      aria-label={`Fuel and service cost over time: ${rows.map((r) => `${r.label} RM${r.totalCost.toFixed(0)}`).join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
          <XAxis
            dataKey="label"
            stroke={theme.colors.textSecondary}
            fontSize={12}
          />
          <YAxis
            stroke={theme.colors.textSecondary}
            fontSize={12}
            tickFormatter={(v) => `RM${v}`}
          />
          <Tooltip
            formatter={(v) => `RM${Number(v).toFixed(2)}`}
            labelStyle={{ color: theme.colors.text }}
            contentStyle={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "8px",
              color: theme.colors.text,
            }}
          />
          <Legend />
          <Bar
            dataKey="fuelCost"
            name="Fuel"
            stackId="c"
            fill={theme.colors.analytics.fuel}
          />
          <Bar
            dataKey="serviceCost"
            name="Service"
            stackId="c"
            fill={theme.colors.analytics.service}
          />
          {previous && previous.length > 0 && (
            <Line
              dataKey="previousTotal"
              name="Previous period"
              stroke={theme.colors.textSecondary}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
