import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { NotificationPopup } from "@/components/ui/NotificationPopup";
import type { NotificationData } from "@/lib/services/notificationService";
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
let mockDimensions = { width: 390, height: 844, scale: 1, fontScale: 1 };
let mockMobileWeb = false;
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isMobile: mockMobileWeb }),
}));
const mockInsets = { top: 47, bottom: 34, left: 0, right: 0 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDimensions,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));

const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockRefresh = jest.fn(async () => {});
let mockLoading = false;
let mockError: Error | null = null;
let mockPending = false;
let mockNotifications: NotificationData[] = [];

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    isInitialized: true,
    isLoading: mockLoading,
    error: mockError,
    isRefreshing: false,
    isMarkingRead: mockPending,
    refreshNotifications: mockRefresh,
    unreadCount: mockNotifications.filter((item) => !item.read).length,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
  }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoading = false;
  mockError = null;
  mockPending = false;
  mockMobileWeb = false;
  mockDimensions = { width: 390, height: 844, scale: 1, fontScale: 1 };
  mockNotifications = Array.from({ length: 7 }, (_, index) => ({
    id: `notification-${index}`,
    user_id: "user-1",
    notification_type: "fuel_log" as const,
    title: `Notification ${index}`,
    body: `Message ${index}`,
    read: false,
    data: null,
    related_vehicle_id: "vehicle-1",
    created_at: new Date(2026, 9, 13 - index).toISOString(),
  }));
});

it("previews only the five newest cached notifications without marking them read", () => {
  render(<NotificationPopup visible onClose={jest.fn()} />);
  for (let index = 0; index < 5; index++) {
    expect(screen.getByText(`Message ${index}`)).toBeTruthy();
  }
  expect(screen.queryByText("Message 5")).toBeNull();
  expect(screen.queryByText("Message 6")).toBeNull();
  expect(mockMarkAsRead).not.toHaveBeenCalled();
});

it("marks a clicked notification read, closes the popup, and opens its existing route", () => {
  const onClose = jest.fn();
  render(<NotificationPopup visible onClose={onClose} />);
  fireEvent.press(screen.getByText("Notification 0"));
  expect(mockMarkAsRead).toHaveBeenCalledWith("notification-0");
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith("/vehicles/vehicle-1");
});

it("opens the full page for invitations and the View all action", () => {
  mockNotifications[0].notification_type = "group_invite";
  const onClose = jest.fn();
  render(<NotificationPopup visible onClose={onClose} />);
  fireEvent.press(screen.getByText("Notification 0"));
  expect(router.push).toHaveBeenCalledWith("/notifications");
  fireEvent.press(screen.getByText("View all notifications"));
  expect(onClose).toHaveBeenCalledTimes(2);
  expect(router.push).toHaveBeenCalledTimes(2);
});

it("shows an empty state and allows dismissal", () => {
  mockNotifications = [];
  const onClose = jest.fn();
  render(<NotificationPopup visible onClose={onClose} />);
  expect(screen.getByText("No notifications")).toBeTruthy();
  fireEvent.press(screen.getAllByLabelText("Close notifications")[0]);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("shows query loading while the first request is pending", () => {
  mockNotifications = [];
  mockLoading = true;
  render(<NotificationPopup visible onClose={jest.fn()} />);
  expect(screen.getByText("Loading...")).toBeTruthy();
  expect(screen.queryByText("No notifications")).toBeNull();
});

it("retains its five-item preview on failure and offers Retry", () => {
  mockError = new Error("Offline");
  render(<NotificationPopup visible onClose={jest.fn()} />);
  expect(screen.getByText("Couldn't load notifications")).toBeTruthy();
  expect(screen.getByText("Message 0")).toBeTruthy();
  expect(screen.queryByText("Message 5")).toBeNull();
  fireEvent.press(screen.getByLabelText("Retry notifications"));
  expect(mockRefresh).toHaveBeenCalledTimes(1);
});

it("doesn't show an empty success state on fetch failure", () => {
  mockNotifications = [];
  mockError = new Error("Offline");
  render(<NotificationPopup visible onClose={jest.fn()} />);
  expect(screen.getByText("Couldn't load notifications")).toBeTruthy();
  expect(screen.queryByText("No notifications")).toBeNull();
});

it("disables read actions while saving", () => {
  mockPending = true;
  render(<NotificationPopup visible onClose={jest.fn()} />);
  expect(
    screen.getByLabelText("Mark all notifications as read"),
  ).toBeDisabled();
  expect(screen.getByLabelText("Notification 0")).toBeDisabled();
  expect(mockMarkAsRead).not.toHaveBeenCalled();
});

it.each([
  [320, 568],
  [360, 640],
  [390, 844],
  [844, 390],
])("keeps the native popup inside safe areas at %sx%s", (width, height) => {
  mockDimensions = { ...mockDimensions, width, height };
  render(<NotificationPopup visible onClose={jest.fn()} />);
  const popup = screen
    .UNSAFE_getAllByType(Animated.View)
    .find(
      (node) => StyleSheet.flatten(node.props.style)?.maxHeight !== undefined,
    )!;
  expect(StyleSheet.flatten(popup.props.style)).toMatchObject({
    width: Math.min(360, width - mockInsets.left - mockInsets.right - 32),
    maxHeight: height - mockInsets.top - mockInsets.bottom - 32,
  });
  expect(screen.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
});

it("dismisses the native popup using Android Back", () => {
  const onClose = jest.fn();
  render(<NotificationPopup visible onClose={onClose} />);
  screen.UNSAFE_getByType(Modal).props.onRequestClose();
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("keeps the full Notifications screen reachable with no notification rows", () => {
  mockNotifications = [];
  const onClose = jest.fn();
  render(<NotificationPopup visible onClose={onClose} />);
  fireEvent.press(screen.getByLabelText("View all notifications"));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith("/notifications");
});

it("lets native popup labels and unread badges grow for large text", () => {
  mockDimensions = { width: 320, height: 568, scale: 1, fontScale: 2.5 };
  render(<NotificationPopup visible onClose={jest.fn()} />);
  expect(
    StyleSheet.flatten(screen.getByText("Notifications").props.style)
      .flexShrink,
  ).toBe(1);
  expect(
    StyleSheet.flatten(screen.getByText("View all notifications").props.style),
  ).toMatchObject({ flexShrink: 1, textAlign: "center" });
  const count = screen.getByText("7");
  let parent = count.parent;
  while (parent && StyleSheet.flatten(parent.props.style)?.minHeight !== 20)
    parent = parent.parent;
  expect(parent).toBeTruthy();
  expect(StyleSheet.flatten(parent!.props.style).height).toBeUndefined();
});

it("preserves the anchored web popup bounds", () => {
  jest.replaceProperty(Platform, "OS", "web");
  render(
    <NotificationPopup
      visible
      onClose={jest.fn()}
      anchorPosition={{ top: 100, left: 300 }}
    />,
  );
  const popup = screen
    .UNSAFE_getAllByType(Animated.View)
    .find(
      (node) => StyleSheet.flatten(node.props.style)?.position === "absolute",
    )!;
  expect(StyleSheet.flatten(popup.props.style)).toMatchObject({
    width: 360,
    top: 100,
    left: 18,
    maxHeight: 732,
  });
  jest.restoreAllMocks();
});

it.each([
  [320, 568],
  [390, 844],
  [844, 390],
])(
  "bounds the mobile-web popup at %sx%s and keeps empty View all access",
  (width, height) => {
    jest.replaceProperty(Platform, "OS", "web");
    mockMobileWeb = true;
    mockDimensions = { ...mockDimensions, width, height };
    mockNotifications = [];
    render(<NotificationPopup visible onClose={jest.fn()} />);
    const popup = screen
      .UNSAFE_getAllByType(Animated.View)
      .find(
        (node) => StyleSheet.flatten(node.props.style)?.maxHeight !== undefined,
      )!;
    expect(StyleSheet.flatten(popup.props.style)).toMatchObject({
      width: Math.min(360, width - 32),
      maxHeight: height - mockInsets.top - mockInsets.bottom - 32,
    });
    fireEvent.press(screen.getByLabelText("View all notifications"));
    expect(router.push).toHaveBeenCalledWith("/notifications");
    jest.restoreAllMocks();
  },
);
