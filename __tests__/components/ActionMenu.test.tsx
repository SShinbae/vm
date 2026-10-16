import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { ActionMenu } from "@/components/ui/ActionMenu";

jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

it("constrains a labelled trigger so enlarged text wraps within its toolbar", () => {
  render(
    <ActionMenu label="Sort by date (newest)" minTouchSize={48} items={[]} />,
  );
  expect(
    StyleSheet.flatten(screen.getByRole("button").props.style).maxWidth,
  ).toBe("100%");
  expect(
    StyleSheet.flatten(screen.getByText("Sort by date (newest)").props.style)
      .flexShrink,
  ).toBe(1);
});

it("opens from the measured trigger and runs the selected action", () => {
  jest.useFakeTimers();
  const onPress = jest.fn();
  render(
    <ActionMenu
      label="Sort by date (newest)"
      items={[{ label: "Oldest first", icon: "calendar", onPress }]}
    />,
  );
  const trigger = screen.UNSAFE_getAllByType(TouchableOpacity)[0];
  trigger.props.ref.current.measureInWindow = (callback: any) =>
    callback(500, 100, 200, 44);
  const stopPropagation = jest.fn();
  fireEvent.press(screen.getByLabelText("Sort by date (newest)"), {
    stopPropagation,
  });
  expect(stopPropagation).toHaveBeenCalled();
  const dropdown = screen
    .UNSAFE_getAllByType(View)
    .find((node) => node.props.style?.position === "absolute");
  expect(dropdown?.props.style).toMatchObject({
    left: 500,
    top: 148,
    width: 200,
    right: undefined,
  });
  fireEvent.press(screen.getByText("Oldest first"));
  act(() => jest.runAllTimers());
  expect(onPress).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
