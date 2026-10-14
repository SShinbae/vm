import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { WebPageHeader } from "@/components/layout/WebPageHeader";

let mockPathname = "/";
const mockRefetch = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  usePathname: () => mockPathname,
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "wan@example.com",
      profile: { full_name: "Wan Ahnaf" },
    },
  }),
}));
jest.mock("@/hooks/useAccessibleVehiclesQuery", () => ({
  useAccessibleVehiclesQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ screenWidth: 1200, screenHeight: 800 }),
}));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: 7,
    notifications: [],
    isInitialized: true,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

function openButton(label: string) {
  const button = screen
    .UNSAFE_getAllByType(TouchableOpacity)
    .find((node) => node.props.accessibilityLabel === label);
  button!.props.ref.current.measureInWindow = (
    callback: (...bounds: number[]) => void,
  ) => callback(600, 100, 44, 44);
  fireEvent.press(screen.getAllByLabelText(label)[0]);
}

beforeEach(() => {
  mockPathname = "/";
  jest.clearAllMocks();
});

it.each(["Profile", "Settings"])(
  "opens the %s destination with user identity in the avatar menu",
  (tab) => {
    render(<WebPageHeader />);
    openButton("Profile menu");
    expect(screen.getByText("Wan Ahnaf")).toBeTruthy();
    expect(screen.getByText("wan@example.com")).toBeTruthy();
    fireEvent.press(screen.getByText(tab));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/profile",
      params: { tab },
    });
    expect(screen.queryByText("Settings")).toBeNull();
  },
);

it("changes page title, closes menus, and clears vehicle lookup on navigation", () => {
  const { rerender } = render(<WebPageHeader />);
  fireEvent.changeText(screen.getByLabelText("Search vehicles"), "Civic");
  openButton("Profile menu");
  mockPathname = "/vehicles";
  rerender(<WebPageHeader />);
  expect(screen.getByText("Vehicles")).toBeTruthy();
  expect(mockRefetch).toHaveBeenCalledTimes(2);
  expect(mockRefetch).toHaveBeenLastCalledWith({ cancelRefetch: false });
  expect(screen.queryByText("Settings")).toBeNull();
  expect(screen.getByLabelText("Search vehicles").props.value).toBe("");
  mockPathname = "/logs";
  rerender(<WebPageHeader />);
  expect(screen.getByText("Logs")).toBeTruthy();
});

it("opens notifications from the shared header without navigating", () => {
  render(<WebPageHeader />);
  openButton("Notifications, 7 unread");
  expect(screen.getByText("No notifications")).toBeTruthy();
  expect(router.push).not.toHaveBeenCalled();
  fireEvent.press(screen.getAllByLabelText("Close notifications")[0]);
  expect(screen.queryByText("No notifications")).toBeNull();
});
