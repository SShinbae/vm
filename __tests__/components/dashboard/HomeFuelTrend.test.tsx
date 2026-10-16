import { HomeFuelTrend } from "@/components/dashboard/HomeFuelTrend";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

jest.mock("@/components/charts/LineChart", () => ({ LineChart: () => null }));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: () => ({}),
  useStyles: () => ({ styles: {}, theme: { colors: { primary: "blue" } } }),
}));

it("changes the fuel chart range and explains when no fuel costs exist", () => {
  const onMonthsChange = jest.fn();
  render(
    <HomeFuelTrend
      points={[]}
      months={6}
      onMonthsChange={onMonthsChange}
      loading={false}
      error={null}
    />,
  );
  fireEvent.press(screen.getByText("12 months"));
  expect(onMonthsChange).toHaveBeenCalledWith(12);
  expect(screen.getByText("No fuel costs in this period")).toBeTruthy();
});
