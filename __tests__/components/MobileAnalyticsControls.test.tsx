import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import { AnalyticsVehiclePicker } from "@/components/analytics/AnalyticsVehiclePicker";
import { VehicleFilter } from "@/components/analytics/VehicleFilter";
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: false, isMobile: true }),
}));
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ visible, children }: any) => (visible ? <>{children}</> : null),
}));
jest.mock("@/components/analytics/DateRangePicker", () => ({
  DateRangePicker: ({ visible, onConfirm }: any) => {
    const { Button } = require("react-native");
    return visible ? (
      <Button
        title="Choose test dates"
        onPress={() => onConfirm(new Date(2026, 8, 1), new Date(2026, 8, 10))}
      />
    ) : null;
  },
}));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn() }));
const period = {
  label: "30 Days",
  days: 30,
  startDate: new Date(2026, 8, 1),
  endDate: new Date(2026, 9, 1),
};
it("selects a preset and applies custom dates without requiring a callback", async () => {
  const onChange = jest.fn();
  render(
    <PeriodSelector
      selectedPeriod={period}
      periods={[period, { ...period, label: "7 Days", days: 7 }]}
      onPeriodChange={onChange}
    />,
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Select analytics period" }),
  );
  fireEvent.press(screen.getByRole("button", { name: "7 Days" }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ days: 7 }));
  fireEvent.press(
    screen.getByRole("button", { name: "Select analytics period" }),
  );
  fireEvent.press(screen.getByRole("button", { name: "Custom Range" }));
  fireEvent.press(screen.getByText("Choose test dates"));
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      startDate: new Date(2026, 8, 1),
      endDate: new Date(2026, 8, 10),
    }),
  );
});
it("searches vehicle names/plates and applies multiple selections only after Apply", () => {
  const toggle = jest.fn();
  const all = jest.fn();
  render(
    <VehicleFilter
      vehicles={
        [
          {
            id: "a",
            year: 2022,
            make: "Honda",
            model: "Civic",
            license_plate: "ABC1",
          },
          {
            id: "b",
            year: 2020,
            make: "Perodua",
            model: "Myvi",
            license_plate: "XYZ2",
          },
        ] as any
      }
      selectedVehicleIds={[]}
      onToggleVehicle={toggle}
      onSelectAll={all}
      onClearAll={jest.fn()}
    />,
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Filter analytics by vehicle" }),
  );
  fireEvent.changeText(
    screen.getByLabelText("Search vehicles by name or plate"),
    "XYZ",
  );
  expect(
    screen.queryByRole("button", { name: "2022 Honda Civic, ABC1" }),
  ).toBeNull();
  fireEvent.press(
    screen.getByRole("button", { name: "2020 Perodua Myvi, XYZ2" }),
  );
  expect(toggle).not.toHaveBeenCalled();
  fireEvent.changeText(
    screen.getByLabelText("Search vehicles by name or plate"),
    "",
  );
  fireEvent.press(
    screen.getByRole("button", { name: "2022 Honda Civic, ABC1" }),
  );
  fireEvent.press(screen.getByText("Apply"));
  expect(toggle.mock.calls).toEqual([["b"], ["a"]]);
  expect(screen.queryByText("Choose vehicles")).toBeNull();
});
it("discards a draft selection on Cancel", () => {
  const toggle = jest.fn();
  render(
    <VehicleFilter
      vehicles={
        [
          {
            id: "a",
            year: 2022,
            make: "Honda",
            model: "Civic",
            license_plate: "ABC1",
          },
        ] as any
      }
      selectedVehicleIds={[]}
      onToggleVehicle={toggle}
      onSelectAll={jest.fn()}
      onClearAll={jest.fn()}
    />,
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Filter analytics by vehicle" }),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "2022 Honda Civic, ABC1" }),
  );
  fireEvent.press(screen.getByText("Cancel"));
  expect(toggle).not.toHaveBeenCalled();
});

it("keeps compact custom dates readable and exposes their full value", () => {
  render(
    <PeriodSelector
      compact
      selectedPeriod={{ ...period, label: "01/01/2026 – 10/10/2026" }}
      periods={[period]}
      onPeriodChange={jest.fn()}
    />,
  );
  expect(screen.getByText("Custom dates")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Select analytics period" }),
  ).toHaveAccessibilityValue({ text: "01/01/2026 – 10/10/2026" });
});
it("shortens the compact vehicle label while exposing its full identity", () => {
  render(
    <AnalyticsVehiclePicker
      compact
      vehicles={
        [
          {
            id: "a",
            year: 2022,
            make: "Honda",
            model: "Civic",
            license_plate: "ABC1234",
          },
        ] as any
      }
      selectedVehicleIds={["a"]}
      onToggleVehicle={jest.fn()}
      onSelectAll={jest.fn()}
    />,
  );
  expect(screen.getByText("Honda Civic")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Filter analytics by vehicle" }),
  ).toHaveAccessibilityValue({ text: "2022 Honda Civic · ABC1234" });
});
