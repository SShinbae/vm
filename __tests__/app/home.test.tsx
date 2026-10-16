import DashboardScreen from "@/app/(tabs)/index";
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import React from "react";
import { ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";

const mockLayout = { isDesktop: false, isWeb: false, isMobile: false };
let mockServiceReminders: any[] = [];
let mockRemindersLoading = false;
let mockRemindersError: string | null = null;
let mockLoading = false;
let mockError: string | null = null;
let mockVehicles = [1, 2, 3, 4, 5, 6].map((id) => ({ id: `vehicle-${id}` }));
let mockDimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
let mockBlur: (() => void) | undefined;
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDimensions,
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: any) => {
    const React = require("react");
    React.useEffect(() => {
      mockBlur = callback();
      return mockBlur;
    }, [callback]);
  },
}));
jest.mock("@tanstack/react-query", () => {
  const client = { invalidateQueries: jest.fn() };
  return { useQueryClient: () => client };
});
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
jest.mock("@/components/layout/WebPageHeader", () => ({
  WebPageHeader: () => {
    const { Text } = require("react-native");
    return <Text>Shared Home header</Text>;
  },
}));
jest.mock("@/components/ui/Skeleton", () => ({
  SkeletonDashboard: () => {
    const { Text } = require("react-native");
    return <Text>Loading Home</Text>;
  },
}));
jest.mock("@/components/ui/NotificationBell", () => ({
  NotificationBell: ({ onPress }: any) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress} accessibilityLabel="Notifications">
        <Text>Bell</Text>
      </TouchableOpacity>
    );
  },
}));
jest.mock("@/components/ui/NotificationPopup", () => ({
  NotificationPopup: ({ visible }: any) => {
    const { Text } = require("react-native");
    return visible ? <Text>Notification preview</Text> : null;
  },
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
  QuickActionButton: ({ title, onPress }: any) => {
    const { Text, TouchableOpacity } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));
jest.mock("@/components/dashboard/HomeFuelTrend", () => ({
  HomeFuelTrend: () => {
    const { Text } = require("react-native");
    return <Text>Fuel cost trend</Text>;
  },
}));
jest.mock("@/components/dashboard/HomeVehicleSearch", () => ({
  HomeVehicleSearch: () => {
    const { Text } = require("react-native");
    return <Text>Vehicle search</Text>;
  },
}));
jest.mock("@/hooks/useDashboardDataQuery", () => ({
  useDashboardDataQuery: () => ({
    stats: { totalVehicles: 4, monthlyFuelCost: 42, totalMileage: 1000 },
    vehicles: mockVehicles,
    recentActivity: [1, 2, 3, 4, 5, 6].map((id) => ({ id: `activity-${id}` })),
    serviceReminders: mockServiceReminders,
    remindersLoading: mockRemindersLoading,
    remindersError: mockRemindersError,
    fuelCostTrend: [],
    fuelTrendLoading: false,
    fuelTrendError: null,
    loading: mockLoading,
    refreshing: false,
    error: mockError,
    user: { profile: { full_name: "Wan" } },
    onRefresh: jest.fn(),
  }),
}));

it("limits Home vehicles to three and shows five recent activities", () => {
  render(<DashboardScreen />);
  expect(screen.getByText("vehicle-3")).toBeTruthy();
  expect(screen.queryByText("vehicle-4")).toBeNull();
  expect(screen.getByText("activity-5")).toBeTruthy();
  expect(screen.queryByText("activity-6")).toBeNull();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockLoading = false;
  mockError = null;
  mockLayout.isDesktop = false;
  mockLayout.isWeb = false;
  mockLayout.isMobile = false;
  mockVehicles = [1, 2, 3, 4, 5, 6].map((id) => ({ id: `vehicle-${id}` }));
  mockDimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
});

it("keeps native cards and the bell at large widths", () => {
  mockLayout.isDesktop = true;
  render(<DashboardScreen />);
  expect(screen.getByLabelText("Notifications")).toBeTruthy();
  expect(screen.getByText("vehicle-3")).toBeTruthy();
  expect(screen.queryByText("table: 3")).toBeNull();
  mockLayout.isDesktop = false;
});

it("keeps the desktop web table at five vehicles", () => {
  mockLayout.isDesktop = true;
  mockLayout.isWeb = true;
  render(<DashboardScreen />);
  expect(screen.getByText("table: 5")).toBeTruthy();
  mockLayout.isDesktop = false;
  mockLayout.isWeb = false;
});

it("scrolls the greeting and search with the native actions-first content", () => {
  render(<DashboardScreen />);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(within(scroll).getByText("Welcome back, Wan")).toBeTruthy();
  expect(within(scroll).getByText("Vehicle search")).toBeTruthy();
  const text = within(scroll)
    .UNSAFE_getAllByType(Text)
    .map((node) => node.props.children)
    .flat();
  expect(text.indexOf("Quick Actions")).toBeLessThan(
    text.indexOf("My Vehicles"),
  );
  expect(text.indexOf("My Vehicles")).toBeLessThan(
    text.indexOf("Fuel cost trend"),
  );
  expect(text.indexOf("Fuel cost trend")).toBeLessThan(
    text.indexOf("Recent Activity"),
  );
});

it.each([
  [320, 1, 1],
  [360, 1, 2],
  [390, 1, 2],
  [844, 1, 2],
  [390, 1.3, 1],
])(
  "uses %s-point width and font scale %s for %s native grid columns",
  (width, fontScale, columns) => {
    mockDimensions = { ...mockDimensions, width, fontScale };
    render(<DashboardScreen />);
    for (const grid of screen.UNSAFE_getAllByType(ResponsiveGrid)) {
      expect(grid.props.columns.mobile).toBe(columns);
      expect(grid.props.columns.desktop).toBe(columns);
    }
  },
);

it("opens the notification preview and closes it on blur", () => {
  render(<DashboardScreen />);
  fireEvent.press(screen.getByLabelText("Notifications"));
  expect(screen.getByText("Notification preview")).toBeTruthy();
  act(() => mockBlur?.());
  expect(screen.queryByText("Notification preview")).toBeNull();
});

it.each(["loading", "error", "empty"])(
  "keeps the bell available during %s",
  (state) => {
    mockVehicles = [];
    mockLoading = state === "loading";
    mockError = state === "error" ? "Offline" : null;
    render(<DashboardScreen />);
    fireEvent.press(screen.getByLabelText("Notifications"));
    expect(screen.getByText("Notification preview")).toBeTruthy();
  },
);

it.each([
  ["Add Fuel", "/logs/fuel/add"],
  ["Log Service", "/logs/service/add"],
  ["Update Mileage", "/logs/mileage/add"],
  ["Add Vehicle", "/vehicles/add"],
])("retains the %s destination", (title, route) => {
  render(<DashboardScreen />);
  fireEvent.press(screen.getByText(title));
  expect(router.push).toHaveBeenCalledWith(route);
});

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

it.each([320, 360, 390, 844])(
  "uses the compact Home on mobile web at %s CSS pixels",
  (width) => {
    mockLayout.isWeb = true;
    mockLayout.isMobile = true;
    mockDimensions = { ...mockDimensions, width };
    render(<DashboardScreen />);
    const scroll = screen.UNSAFE_getByType(ScrollView);
    expect(within(scroll).getByText("Welcome back, Wan")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Notifications"));
    expect(screen.getByText("Notification preview")).toBeTruthy();
    expect(screen.getByText("vehicle-3")).toBeTruthy();
    expect(screen.queryByText("vehicle-4")).toBeNull();
    const text = within(scroll)
      .UNSAFE_getAllByType(Text)
      .map((node) => node.props.children)
      .flat();
    expect(text.indexOf("My Vehicles")).toBeLessThan(
      text.indexOf("Fuel cost trend"),
    );
    for (const grid of screen.UNSAFE_getAllByType(ResponsiveGrid))
      expect(grid.props.columns.mobile).toBe(width === 320 ? 1 : 2);
  },
);

it("closes the mobile-web popup when changing to the desktop layout", () => {
  mockLayout.isWeb = true;
  mockLayout.isMobile = true;
  const view = render(<DashboardScreen />);
  fireEvent.press(screen.getByLabelText("Notifications"));
  mockLayout.isMobile = false;
  mockLayout.isDesktop = true;
  view.rerender(<DashboardScreen />);
  expect(screen.getByText("table: 5")).toBeTruthy();
  expect(screen.queryByText("Notification preview")).toBeNull();
  mockLayout.isMobile = true;
  mockLayout.isDesktop = false;
  view.rerender(<DashboardScreen />);
  expect(screen.queryByText("Notification preview")).toBeNull();
});
