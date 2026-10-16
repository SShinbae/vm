import React from "react";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { ScrollView } from "react-native";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ visible, children }: any) => (visible ? <>{children}</> : null),
}));
jest.mock("react-native-ui-datepicker", () => {
  const { View } = require("react-native");
  return function MockDateTimePicker(props: any) {
    return <View testID="calendar" {...props} />;
  };
});
it("resets the visible dates from the active period when reopened", () => {
  const props = {
    visible: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    initialStartDate: new Date(2026, 8, 1),
    initialEndDate: new Date(2026, 8, 10),
  };
  const { rerender } = render(<DateRangePicker {...props} />);
  rerender(<DateRangePicker {...props} visible={false} />);
  rerender(
    <DateRangePicker
      {...props}
      initialStartDate={new Date(2026, 9, 2)}
      initialEndDate={new Date(2026, 9, 20)}
    />,
  );
  expect(screen.getByText("02/10/2026")).toBeTruthy();
  expect(screen.getByText("20/10/2026")).toBeTruthy();
});
it("keeps invalid dates on screen and allows correction before confirming", () => {
  const onConfirm = jest.fn();
  render(
    <DateRangePicker
      visible
      onClose={jest.fn()}
      onConfirm={onConfirm}
      initialStartDate={new Date(2026, 9, 10)}
      initialEndDate={new Date(2026, 9, 1)}
    />,
  );
  fireEvent.press(screen.getByText("Confirm"));
  expect(screen.getByText("End date must be after start date")).toBeTruthy();
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent(screen.getAllByTestId("calendar")[1], "change", {
    date: new Date(2026, 9, 20),
  });
  fireEvent.press(screen.getByText("Confirm"));
  expect(onConfirm).toHaveBeenCalledWith(
    new Date(2026, 9, 10),
    new Date(2026, 9, 20),
  );
});

it("keeps Confirm and validation inside the scrollable date form", () => {
  render(
    <DateRangePicker
      visible
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      initialStartDate={new Date(2026, 9, 10)}
      initialEndDate={new Date(2026, 9, 1)}
    />,
  );
  const form = screen.UNSAFE_getByType(ScrollView);
  expect(within(form).getByText("Confirm")).toBeTruthy();
  fireEvent.press(screen.getByText("Confirm"));
  expect(
    within(form).getByText("End date must be after start date"),
  ).toBeTruthy();
});
