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
import { TouchableOpacity, ScrollView, StyleSheet } from "react-native";

let mockNotifications: NotificationData[] = [];
let mockInvitations: { id: string; groups: { name: string } }[] = [];
const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockRefresh = jest.fn(async () => {});
const mockShowError = jest.fn();
let mockLoading = false;
let mockError: Error | null = null;
let mockMarkingRead = false;
let mockFocus: (() => void | (() => void)) | undefined;
let mockBlur: void | (() => void);

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => {
      mockFocus = callback;
      mockBlur = callback();
      return () => mockBlur?.();
    }, [callback]);
  },
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));
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
    isLoading: mockLoading,
    error: mockError,
    isMarkingRead: mockMarkingRead,
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
  mockLoading = false;
  mockError = null;
  mockMarkingRead = false;
  mockRefresh.mockResolvedValue(undefined);
  jest
    .mocked(GroupInvitationService.acceptInvitation)
    .mockReset()
    .mockResolvedValue({ error: null } as any);
  jest
    .mocked(GroupInvitationService.declineInvitation)
    .mockReset()
    .mockResolvedValue({ error: null } as any);
  jest
    .mocked(GroupInvitationService.getUserInvitations)
    .mockImplementation(async () => ({ data: mockInvitations }) as any);
  mockLayout.isMobile = false;
  mockLayout.isWeb = true;
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

it("uses the shared mobile heading and All/Unread filters", async () => {
  mockLayout.isMobile = true;
  render(<NotificationsScreen />);
  await act(async () => {});
  expect(screen.getByText("Notifications")).toBeTruthy();
  expect(screen.getByRole("header", { name: "Notifications" })).toBeTruthy();
  expect(
    screen.getByRole("tab", { name: "All (7)", selected: true }),
  ).toBeTruthy();
  expect(screen.getByText("Message 0")).toBeTruthy();
});

it("shows real query loading instead of an empty state", async () => {
  mockLoading = true;
  mockNotifications = [];
  render(<NotificationsScreen />);
  await act(async () => {});
  expect(screen.getByText("Loading notifications...")).toBeTruthy();
  expect(screen.queryByText("You're all caught up")).toBeNull();
});

it("keeps cached notifications visible with a recoverable query error", async () => {
  mockError = new Error("Offline");
  render(<NotificationsScreen />);
  await act(async () => {});
  expect(screen.getByText("Couldn't load notifications")).toBeTruthy();
  expect(screen.getByText("Message 0")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Retry notifications"));
  await act(async () => {});
  expect(mockRefresh).toHaveBeenCalledTimes(2);
});

it("shows invitation fetch failures and recovers on Retry", async () => {
  jest.mocked(GroupInvitationService.getUserInvitations).mockResolvedValueOnce({
    data: null,
    error: "Offline",
    loading: false,
  });
  render(<NotificationsScreen />);
  await waitFor(() =>
    expect(screen.getByText("Couldn't load invitations")).toBeTruthy(),
  );
  mockInvitations = [{ id: "invite-1", groups: { name: "Family" } }];
  fireEvent.press(screen.getByLabelText("Retry invitations"));
  await waitFor(() =>
    expect(screen.getByLabelText("Accept invitation to Family")).toBeTruthy(),
  );
  expect(screen.queryByText("Couldn't load invitations")).toBeNull();
});

it("refreshes both sources on focus and ignores invitation results after blur", async () => {
  let finish: (result: any) => void = () => {};
  jest.mocked(GroupInvitationService.getUserInvitations).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<NotificationsScreen />);
  await act(async () => {});
  act(() => {
    mockBlur?.();
  });
  await act(async () => {
    finish({ data: [{ id: "old", groups: { name: "Old" } }] });
  });
  expect(screen.queryByLabelText("Accept invitation to Old")).toBeNull();
  mockInvitations = [{ id: "new", groups: { name: "New" } }];
  await act(async () => {
    mockBlur = mockFocus?.();
  });
  expect(screen.getByLabelText("Accept invitation to New")).toBeTruthy();
  expect(mockRefresh).toHaveBeenCalledTimes(2);
});

it.each(["Accept", "Decline"])(
  "guards repeated %s while an invitation response is pending",
  async (action) => {
    let finish: (result: any) => void = () => {};
    const method =
      action === "Accept"
        ? GroupInvitationService.acceptInvitation
        : GroupInvitationService.declineInvitation;
    (method as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    mockInvitations = [{ id: "invite-1", groups: { name: "Family" } }];
    const view = render(<NotificationsScreen />);
    await act(async () => {});
    const button = view
      .UNSAFE_getAllByType(TouchableOpacity)
      .find(
        (button) =>
          button.props.accessibilityLabel === `${action} invitation to Family`,
      )!;
    const callback = button.props.onPress;
    act(() => {
      callback();
      callback();
    });
    expect(method).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Accept invitation to Family")).toBeDisabled();
    expect(
      screen.getByLabelText("Decline invitation to Family"),
    ).toBeDisabled();
    await act(async () => {
      finish({ error: "Try again" });
    });
    expect(mockShowError).toHaveBeenCalledWith("Try again");
    expect(
      screen.getByLabelText("Accept invitation to Family"),
    ).not.toBeDisabled();
  },
);

it("removes accepted invitations even if the follow-up refresh fails", async () => {
  mockInvitations = [{ id: "invite-1", groups: { name: "Family" } }];
  render(<NotificationsScreen />);
  await act(async () => {});
  mockRefresh.mockRejectedValueOnce(new Error("Offline"));
  jest
    .mocked(GroupInvitationService.getUserInvitations)
    .mockResolvedValueOnce({ data: null, error: "Offline", loading: false });
  fireEvent.press(screen.getByLabelText("Accept invitation to Family"));
  await waitFor(() =>
    expect(screen.queryByLabelText("Accept invitation to Family")).toBeNull(),
  );
  expect(mockShowError).not.toHaveBeenCalledWith("Failed to accept invitation");
});

it("disables read actions while a read update is pending", async () => {
  mockMarkingRead = true;
  render(<NotificationsScreen />);
  await act(async () => {});
  expect(screen.getByLabelText("Mark all as read")).toBeDisabled();
  fireEvent.press(screen.getByLabelText("Unread: Notification 0"));
  expect(mockMarkAsRead).not.toHaveBeenCalled();
});

it.each([false, true])(
  "loads mobile batches without remounting the scroller and resets on filter change, web=%s",
  async (isWeb) => {
    mockLayout.isWeb = isWeb;
    mockLayout.isMobile = true;
    mockNotifications = Array.from({ length: 25 }, (_, index) => ({
      ...mockNotifications[0],
      id: `n-${index}`,
      title: `Item ${index}`,
      body: `Body ${index}`,
      read: index % 2 === 1,
    }));
    const view = render(<NotificationsScreen />);
    await act(async () => {});
    const scroll = screen.UNSAFE_getByType(ScrollView);
    const scrollTo = jest.spyOn(scroll.instance, "scrollTo");
    expect(screen.getByText("Body 9")).toBeTruthy();
    expect(screen.queryByText("Body 10")).toBeNull();
    expect(screen.queryByLabelText("Next page")).toBeNull();
    fireEvent.press(
      screen.getByRole("button", { name: "Load 10 more notifications" }),
    );
    expect(screen.getByText("Body 19")).toBeTruthy();
    expect(screen.queryByText("Body 20")).toBeNull();
    expect(screen.UNSAFE_getByType(ScrollView)).toBe(scroll);
    await act(async () => {
      await scroll.props.refreshControl.props.onRefresh();
    });
    mockNotifications = mockNotifications.map((notification) => ({
      ...notification,
    }));
    view.rerender(<NotificationsScreen />);
    expect(screen.getByText("Body 19")).toBeTruthy();
    fireEvent.press(
      screen.getByRole("button", { name: "Load 10 more notifications" }),
    );
    expect(screen.getByText("Body 24")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Load 10 more notifications" }),
    ).toBeNull();
    fireEvent.press(screen.getByRole("tab", { name: "Unread (13)" }));
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
    expect(screen.getByText("Body 18")).toBeTruthy();
    expect(screen.queryByText("Body 20")).toBeNull();
    expect(screen.queryByText("Body 1")).toBeNull();
    expect(
      screen.getByRole("tab", { name: "Unread (13)", selected: true }),
    ).toBeTruthy();
  },
);
it("offers mobile Back, wrapping messages and a separate comfortable Snooze target", async () => {
  mockLayout.isMobile = true;
  render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Message 0").props.numberOfLines).toBeUndefined();
  const snooze = screen.getAllByLabelText("Snooze this notification type")[0];
  expect(
    StyleSheet.flatten(snooze.props.style).minHeight,
  ).toBeGreaterThanOrEqual(48);
  fireEvent.press(snooze);
  expect(mockMarkAsRead).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
});

it("retains the expanded mobile batch after a read-state update or refresh error", async () => {
  mockLayout.isMobile = true;
  mockNotifications = Array.from({ length: 21 }, (_, index) => ({
    ...mockNotifications[0],
    id: `n-${index}`,
    title: `Item ${index}`,
    body: `Body ${index}`,
  }));
  const view = render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(
    screen.getByRole("button", { name: "Load 10 more notifications" }),
  );
  mockNotifications = mockNotifications.map((item, index) =>
    index === 0 ? { ...item, read: true } : item,
  );
  mockError = new Error("Offline");
  view.rerender(<NotificationsScreen />);
  expect(screen.getByText("Body 19")).toBeTruthy();
  expect(screen.queryByText("Body 20")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Retry notifications" }),
  ).toBeTruthy();
});

it("opens mobile notifications with the full message exposed to screen readers", async () => {
  mockLayout.isMobile = true;
  render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(
    screen.getByRole("button", {
      name: /^Unread: Notification 0\. Message 0\./,
    }),
  );
  expect(mockMarkAsRead).toHaveBeenCalledWith("notification-0");
  expect(router.push).toHaveBeenCalledWith("/vehicles/vehicle-1");
});
it("falls back to Home when mobile Notifications has no previous screen", async () => {
  mockLayout.isMobile = true;
  jest.mocked(router.canGoBack).mockReturnValueOnce(false);
  render(<NotificationsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith("/");
});

it("makes the mobile mark-all-read action span the content width", async () => {
  mockLayout.isMobile = true;
  render(<NotificationsScreen />);
  await act(async () => {});
  const button = screen.getByRole("button", { name: "Mark all as read" });
  expect(StyleSheet.flatten(button.props.style).width).toBe("100%");
});
