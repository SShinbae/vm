import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { LineChart } from "@/components/charts/LineChart";
import { CostLineChart } from "@/components/analytics/charts/CostLineChart";
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isMobile: true, isTablet: false }),
}));
jest.mock("react-native-chart-kit", () => ({
  LineChart: (props: any) => {
    const { View } = require("react-native");
    return <View testID="chart" {...props} />;
  },
}));
it.each(["trend", "cost"])(
  "sizes %s charts from their padded container and updates on rotation",
  (kind) => {
    if (kind === "trend")
      render(
        <LineChart
          title="Measured chart"
          data={Array.from({ length: 30 }, (_, i) => ({
            x: `2026-10-${i + 1}`,
            label: `Day ${i + 1}`,
            y: i,
          }))}
        />,
      );
    else
      render(
        <CostLineChart
          title="Measured chart"
          data={Array.from({ length: 30 }, (_, i) => ({
            timestamp: i,
            grouping: "day" as const,
            label: `Day ${i + 1}`,
            date: `2026-10-${i + 1}`,
            totalCost: i,
            fuelCost: i,
            serviceCost: 0,
          }))}
        />,
      );
    fireEvent(screen.getByLabelText("Measured chart"), "layout", {
      nativeEvent: { layout: { width: 288 } },
    });
    expect(screen.getByTestId("chart").props.width).toBe(288);
    expect(
      screen.getByTestId("chart").props.data.labels.filter(Boolean).length,
    ).toBeLessThan(8);
    fireEvent(screen.getByLabelText("Measured chart"), "layout", {
      nativeEvent: { layout: { width: 620 } },
    });
    expect(screen.getByTestId("chart").props.width).toBe(620);
  },
);
