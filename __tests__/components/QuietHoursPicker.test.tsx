import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { QuietHoursPicker } from "@/components/notifications/QuietHoursPicker";
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
it("adjusts labelled time controls across midnight and preserves 30-minute steps", () => {
  const start = jest.fn();
  const end = jest.fn();
  render(
    <QuietHoursPicker
      startTime="00:00"
      endTime="23:30"
      selectedDays={[]}
      onStartTimeChange={start}
      onEndTimeChange={end}
      onDaysChange={jest.fn()}
    />,
  );
  fireEvent.press(
    screen.getByRole("button", { name: "From: 30 minutes earlier" }),
  );
  expect(start).toHaveBeenCalledWith("23:30");
  fireEvent.press(
    screen.getByRole("button", { name: "Until: 30 minutes later" }),
  );
  expect(end).toHaveBeenCalledWith("00:00");
});
it("exposes the selected quiet days and updates them independently", () => {
  const change = jest.fn();
  render(
    <QuietHoursPicker
      startTime="22:00"
      endTime="07:00"
      selectedDays={[1]}
      onStartTimeChange={jest.fn()}
      onEndTimeChange={jest.fn()}
      onDaysChange={change}
    />,
  );
  const monday = screen.getByRole("button", {
    name: "Mon quiet day",
    selected: true,
  });
  fireEvent.press(monday);
  expect(change).toHaveBeenCalledWith([]);
  fireEvent.press(screen.getByRole("button", { name: "Fri quiet day" }));
  expect(change).toHaveBeenLastCalledWith([1, 5]);
});
