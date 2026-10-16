import React from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  data,
  color,
  height = 28,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height, marginTop: 8 }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v) => ({ v }))}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
