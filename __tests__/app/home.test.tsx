import DashboardScreen from "@/app/(tabs)/index";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import React from "react";

const mockLayout = { isDesktop: false, isWeb: false };
let mockServiceReminders: any[] = [];
let mockRemindersLoading = false;
let mockRemindersError: string | null = null;
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: () => {} }));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: () => ({}),
  useStyles: () => ({
    styles: {},
    theme: {
      colors: {
        primary: "blue",
        warning: "orange",
        success: "green",
        error: "red",
        white: "white",
      },
    },
  }),
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/Skeleton", () => ({
  SkeletonDashboard: () => null,
}));
jest.mock("@/components/layout/MaxWidthContainer", () => ({
  MaxWidthContainer: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));
jest.mock("@/components/layout/ResponsiveGrid", () => ({
  ResponsiveGrid: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));
jest.mock("@/components/dashboard/VehicleCard", () => ({
  VehicleCard: ({ vehicle }: any) => {
    const { Text } = require("react-native");
    return <Text>{vehicle.id}</Text>;
  },
}));
jest.mock("@/components/dashboard/VehicleTable", () => ({
  VehicleTable: ({ vehicles }: any) => {
    const { Text } = require("react-native");
    return <Text>table: {vehicles.length}</Text>;
  },
}));
jest.mock("@/components/dashboard/ActivityTimelineItem", () => ({
  ActivityTimelineItem: ({ item }: any) => {
    const { Text } = require("react-native");
    return <Text>{item.id}</Text>;
  },
}));
jest.mock("@/components/dashboard/ServiceAttentionPanel", () => ({
  ServiceAttentionPanel: () => {
    const { Text } = require("react-native");
    return <Text>Attention panel</Text>;
  },
}));
jest.mock("@/components/dashboard/StatCard", () => ({
  StatCard: ({ title }: any) => {
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  },
}));
jest.mock("@/components/dashboard/QuickActionButton", () => ({
  QuickActionButton: ({ title }: any) => {
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  },
}));
jest.mock("@/components/dashboard/HomeFuelTrend", () => ({
  HomeFuelTrend: () => null,
}));
jest.mock("@/components/dashboard/HomeVehicleSearch", () => ({
  HomeVehicleSearch: () => null,
}));
jest.mock("@/hooks/useDashboardDataQuery", () => ({
  useDashboardDataQuery: () => ({
    stats: { totalVehicles: 4, monthlyFuelCost: 42, totalMileage: 1000 },
    vehicles: [1, 2, 3, 4].map((id) => ({ id: `vehicle-${id}` })),
    recentActivity: [1, 2, 3, 4, 5].map((id) => ({ id: `activity-${id}` })),
    serviceReminders: mockServiceReminders,
    remindersLoading: mockRemindersLoading,
    remindersError: mockRemindersError,
    fuelCostTrend: [],
    fuelTrendLoading: false,
    fuelTrendError: null,
    loading: false,
    refreshing: false,
    error: null,
    user: { profile: { full_name: "Wan" } },
    onRefresh: jest.fn(),
  }),
}));

it("limits Home vehicles to three and shows five recent activities", () => {
  render(<DashboardScreen />);
  expect(screen.getByText("vehicle-3")).toBeTruthy();
  expect(screen.queryByText("vehicle-4")).toBeNull();
  expect(screen.getByText("activity-5")).toBeTruthy();
});

it.each(["Profile", "Settings"])(
  "opens the avatar menu and navigates to the %s tab",
  (tab) => {
    mockLayout.isDesktop = true;
    render(<DashboardScreen />);
    const button = screen
      .UNSAFE_getAllByType(TouchableOpacity)
      .find((node) => node.props.accessibilityLabel === "Profile menu");
    button!.props.ref.current.measureInWindow = (
      callback: (...bounds: number[]) => void,
    ) => callback(200, 100, 32, 44);
    fireEvent.press(screen.getAllByLabelText("Profile menu")[0]);
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Settings")).toBeTruthy();
    fireEvent.press(screen.getByText(tab));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/profile",
      params: { tab },
    });
    expect(screen.queryByText("Settings")).toBeNull();
    mockLayout.isDesktop = false;
  },
);

it("hides stale reminders during loading and after a failed refresh", () => {
  mockServiceReminders = [{ id: "reminder-1" }];
  mockRemindersLoading = true;
  const { rerender } = render(<DashboardScreen />);
  expect(screen.queryByText("Attention panel")).toBeNull();

  mockRemindersLoading = false;
  mockRemindersError = "Service unavailable";
  rerender(<DashboardScreen />);
  expect(screen.queryByText("Attention panel")).toBeNull();

  mockRemindersError = null;
  rerender(<DashboardScreen />);
  expect(screen.getByText("Attention panel")).toBeTruthy();

  mockServiceReminders = [];
});
