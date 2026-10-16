import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, StyleSheet } from "react-native";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
it("exposes a heading and keeps Back and the trailing action available", () => {
  const onBack = jest.fn();
  render(
    <MobilePageHeader
      title="Fuel Analytics"
      subtitle="Fuel usage"
      onBack={onBack}
      action={<Text>Action</Text>}
    />,
  );
  expect(screen.getByRole("header", { name: "Fuel Analytics" })).toBeTruthy();
  const back = screen.getByRole("button", { name: "Back" });
  expect(StyleSheet.flatten(back.props.style).minHeight).toBeGreaterThanOrEqual(
    48,
  );
  fireEvent.press(back);
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Action")).toBeTruthy();
});
