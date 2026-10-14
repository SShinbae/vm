import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import NotificationsScreen from "@/app/(tabs)/notifications";
import { GroupInvitationService } from "@/lib/services/groupService";
import { router } from "expo-router";
import type { NotificationData } from "@/lib/services/notificationService";

let mockNotifications: NotificationData[] = [];
let mockInvitations: { id: string; groups: { name: string } }[] = [];
const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockRefresh = jest.fn(async () => {});
const mockShowError = jest.fn();

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/notifications/SnoozeMenu", () => ({
  SnoozeMenu: () => null,
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockNotifications.filter((item) => !item.read).length,
    isInitialized: true,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    refreshNotifications: mockRefresh,
  }),
}));
jest.mock("@/lib/services/groupService", () => ({
  GroupInvitationService: {
    getUserInvitations: jest.fn(async () => ({ data: mockInvitations })),
    acceptInvitation: jest.fn(async () => ({ error: null })),
    declineInvitation: jest.fn(async () => ({ error: null })),
  },
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showError: mockShowError,
  }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ choose: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLayout.isMobile = false;
  mockInvitations = [];
  mockNotifications = Array.from({ length: 7 }, (_, index) => ({
    id: `notification-${index}`,
    user_id: "user-1",
    notification_type: "fuel_log",
    title: `Notification ${index}`,
    body: `Message ${index}`,
    read: index % 2 === 1,
    data: null,
    related_vehicle_id: "vehicle-1",
    created_at: new Date(2026, 9, 14 - index).toISOString(),
  }));
});

it("resets pagination and filters unread items before slicing the page", async () => {
  render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByLabelText("Next page"));
  expect(screen.getByText("Message 5")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Unread (4)"));
  for (const index of [0, 2, 4, 6])
    expect(screen.getByText(`Message ${index}`)).toBeTruthy();
  expect(screen.queryByText("Message 5")).toBeNull();
  expect(screen.getByText("Showing 1–4 of 4")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Mark all as read"));
  expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
});

it("keeps the unread empty state recoverable after notifications become read", async () => {
  const view = render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByLabelText("Unread (4)"));
  mockNotifications = mockNotifications.map((item) => ({
    ...item,
    read: true,
  }));
  view.rerender(<NotificationsScreen />);
  expect(screen.getByText("No unread notifications")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("All (7)"));
  expect(screen.getByText("Message 0")).toBeTruthy();
});

it("keeps snoozing separate from opening or reading a notification", async () => {
  render(<NotificationsScreen />);
  await act(async () => {});
  const stopPropagation = jest.fn();
  fireEvent.press(
    screen.getAllByLabelText("Snooze this notification type")[0],
    { stopPropagation },
  );
  expect(stopPropagation).toHaveBeenCalledTimes(1);
  expect(mockMarkAsRead).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
});

it("marks an opened notification read and follows its existing route", async () => {
  render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByLabelText("Unread: Notification 0"));
  expect(mockMarkAsRead).toHaveBeenCalledWith("notification-0");
  expect(router.push).toHaveBeenCalledWith("/vehicles/vehicle-1");
});

it("retains invitation acceptance while filtering unread notifications", async () => {
  mockInvitations = [{ id: "invite-1", groups: { name: "Family" } }];
  render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByLabelText("Unread (4)"));
  fireEvent.press(screen.getByLabelText("Accept invitation to Family"));
  await waitFor(() =>
    expect(GroupInvitationService.acceptInvitation).toHaveBeenCalledWith(
      "invite-1",
    ),
  );
  expect(mockRefresh).toHaveBeenCalled();
});

it("restores the refresh control after a refresh failure", async () => {
  render(<NotificationsScreen />);
  await act(async () => {});
  mockRefresh.mockRejectedValueOnce(new Error("Offline"));
  fireEvent.press(screen.getByLabelText("Refresh notifications"));
  await waitFor(() =>
    expect(mockShowError).toHaveBeenCalledWith(
      "Failed to refresh notifications",
    ),
  );
  expect(
    screen.getByLabelText("Refresh notifications").props.accessibilityState
      .disabled,
  ).toBe(false);
});

it("retains the mobile heading and list without web filters", async () => {
  mockLayout.isMobile = true;
  render(<NotificationsScreen />);
  await act(async () => {});
  expect(screen.getByText("Notifications")).toBeTruthy();
  expect(screen.queryByLabelText("All (7)")).toBeNull();
  expect(screen.getByText("Message 0")).toBeTruthy();
});
