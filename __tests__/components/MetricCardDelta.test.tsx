import React from "react";
import { render, screen } from "@testing-library/react-native";
import { MetricCard } from "@/components/analytics";

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({
    isWeb: true,
    isMobile: false,
    isTablet: false,
  }),
}));

it("renders no badge without trend", () => {
  render(<MetricCard title="Total Cost" value="RM10" />);
  expect(screen.queryByText(/%/)).toBeNull();
});

it("renders the percentage with a direction word for screen readers", () => {
  render(
    <MetricCard
      title="Total Cost"
      value="RM10"
      trend={{ direction: "up", percentage: 20 }}
    />,
  );
  expect(screen.getByText("20%")).toBeTruthy();
  expect(screen.getByLabelText("Up 20% vs previous period")).toBeTruthy();
});

it("renders zero change as neutral: no arrow, 'No change' label", () => {
  render(
    <MetricCard
      title="Total Cost"
      value="RM10"
      trend={{ direction: "up", percentage: 0 }}
    />,
  );
  expect(screen.getByText("0%")).toBeTruthy();
  expect(screen.queryByText(/[▲▼]/)).toBeNull();
  expect(screen.getByLabelText("No change")).toBeTruthy();
});

it("sparkline with <2 points renders nothing extra", () => {
  const { toJSON } = render(<MetricCard title="Total Cost" value="RM10" />);
  const { toJSON: withOne } = render(
    <MetricCard title="Total Cost" value="RM10" sparkline={[5]} />,
  );
  expect(withOne()).toEqual(toJSON());
});
