import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { NotificationPopup } from "@/components/ui/NotificationPopup";
import type { NotificationData } from "@/lib/services/notificationService";

const mockMarkAsRead = jest.fn();
let mockNotifications: NotificationData[] = [];

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    isInitialized: true,
    unreadCount: mockNotifications.filter((item) => !item.read).length,
    markAsRead: mockMarkAsRead,
    markAllAsRead: jest.fn(),
  }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
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
