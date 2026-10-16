import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Image } from "expo-image";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { StyleSheet } from "react-native";
import { LogDetailsBottomSheet } from "@/components/logs/LogDetailsBottomSheet";
import { Button } from "@/components/ui/Button";
jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet(
      { children, ...props }: any,
      ref: any,
    ) {
      return (
        <View ref={ref} {...props}>
          {children}
        </View>
      );
    }),
    BottomSheetScrollView: View,
    BottomSheetBackdrop: () => null,
  };
});
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 20, left: 0, right: 0 }),
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (fn: any) => fn,
  useStyles: (fn: any) => {
    const theme = require("@/src/design-system").lightTheme;
    return { theme, styles: fn ? fn(theme) : {} };
  },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/ReceiptViewer", () => ({
  ServiceReceiptIndicator: () => null,
}));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
const log = {
  id: "service-1",
  vehicle_id: "car",
  service_type: "oil_change",
  description: "Oil",
  cost: 100,
  date: "2026-10-01",
  created_at: "2026-10-01",
  odometer_reading: 31000,
} as any;
test.each([
  [true, false],
  [true, true],
  [false, false],
  [false, true],
])("guards edit/delete independently (%s/%s)", (canModify, canDelete) => {
  const onEdit = jest.fn(),
    onDelete = jest.fn(),
    onClose = jest.fn();
  render(
    <LogDetailsBottomSheet
      log={log}
      logType="service"
      canModify={canModify}
      canDelete={canDelete}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
  if (!canDelete) expect(screen.getByText("Delete Log")).toBeDisabled();
  // Invoke callbacks directly as well as checking disabled controls.
  for (const button of screen.UNSAFE_getAllByType(Button))
    button.props.onPress();
  expect(onEdit).toHaveBeenCalledTimes(canModify ? 1 : 0);
  expect(onDelete).toHaveBeenCalledTimes(canModify && canDelete ? 1 : 0);
});
test("keeps automatic mileage read-only even when permission props are true", () => {
  const onEdit = jest.fn(),
    onDelete = jest.fn();
  render(
    <LogDetailsBottomSheet
      log={{ ...log, source: "fuel_log" }}
      logType="mileage"
      canModify
      canDelete
      onClose={jest.fn()}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
  expect(screen.queryByText("Edit Log")).toBeNull();
  expect(screen.getByText(/created from fuel logs/)).toBeTruthy();
  expect(onEdit).not.toHaveBeenCalled();
  expect(onDelete).not.toHaveBeenCalled();
});

test("uses safe-area insets and accessible close and receipt actions", () => {
  const onClose = jest.fn();
  render(
    <LogDetailsBottomSheet
      log={{ ...log, receipt_image_url: "receipt.jpg" }}
      logType="service"
      canModify
      canDelete
      onClose={onClose}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );
  const sheet = screen.UNSAFE_getByType(BottomSheet);
  expect(sheet.props.topInset).toBe(24);
  expect(sheet.props.bottomInset).toBe(20);
  const close = screen.getByRole("button", { name: "Close log details" });
  expect(
    StyleSheet.flatten(close.props.style).minHeight,
  ).toBeGreaterThanOrEqual(48);
  fireEvent.press(screen.getByText("View receipt"));
  expect(router.push).toHaveBeenCalledWith("/logs/service/service-1");
  expect(onClose).toHaveBeenCalled();
});
test("falls back when the log vehicle image fails", () => {
  render(
    <LogDetailsBottomSheet
      log={{
        ...log,
        vehicles: {
          id: "car",
          year: 2022,
          make: "Honda",
          model: "Civic",
          main_image_url: "https://example.test/car.jpg",
        },
      }}
      logType="service"
      canModify
      canDelete
      onClose={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );
  fireEvent(screen.UNSAFE_getByType(Image), "error");
  expect(screen.getByLabelText("Vehicle image unavailable")).toBeTruthy();
});
