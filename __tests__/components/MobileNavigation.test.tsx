import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform, StyleSheet, View } from "react-native";
import { Tabs, router } from "expo-router";
import TabLayout from "@/app/(tabs)/_layout";
import { ResponsiveTabBar } from "@/components/navigation/ResponsiveTabBar";

const mockLayout = { isWeb: false, isMobile: true };
const mockInsets = { top: 47, bottom: 34, left: 0, right: 0 };
let mockDark = false;
const mockLaunchRoute = jest.fn(() => null as string | null);
const mockNavigation = {
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Tabs = ({ children }: any) => <View>{children}</View>;
  Tabs.Screen = function Screen() {
    return null;
  };
  return { Tabs, router: { push: jest.fn() }, usePathname: () => "/" };
});
jest.mock("@/components/layout/DashboardWebLayout", () => ({
  DashboardWebLayout: ({ children }: any) => children,
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({ unreadCount: 7 }),
}));
jest.mock("@/lib/services/pushService", () => ({
  pushService: { consumeLaunchRoute: () => mockLaunchRoute() },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme, darkTheme } = require("@/src/design-system");
    const theme = mockDark ? darkTheme : lightTheme;
    return {
      theme,
      styles: factory ? factory(theme) : {},
      breakpoint: "xs",
    };
  },
}));
const names = [
  "index",
  "vehicles",
  "analytics",
  "logs",
  "notifications",
  "profile",
];
function props(active = 0) {
  return {
    state: {
      index: active,
      routes: names.map((name) => ({ key: name, name })),
    },
    descriptors: Object.fromEntries(
      names.map((name) => [
        name,
        {
          options: {
            title:
              name === "index" ? "Home" : name[0].toUpperCase() + name.slice(1),
            ...(name === "notifications"
              ? { tabBarItemStyle: { display: "none" } }
              : {}),
          },
        },
      ]),
    ),
    navigation: mockNavigation,
  } as any;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockLayout.isWeb = false;
  mockLayout.isMobile = true;
  mockLaunchRoute.mockReturnValue(null);
  mockDark = false;
});
afterEach(() => jest.restoreAllMocks());
it("hides only the native Notifications tab while retaining its route", () => {
  render(<TabLayout />);
  const routes = screen.UNSAFE_getAllByType(Tabs.Screen);
  const notification = routes.find(
    (route) => route.props.name === "notifications",
  )!;
  expect(notification.props.options.href).toBeNull();
  expect(
    routes
      .filter((route) => route.props.options.href !== null)
      .map((route) => route.props.name),
  ).toEqual(["index", "vehicles", "analytics", "logs", "profile"]);
});
it("uses five mobile-web tabs and keeps the Notifications route", () => {
  mockLayout.isWeb = true;
  render(<TabLayout />);
  expect(
    screen
      .UNSAFE_getAllByType(Tabs.Screen)
      .find((route) => route.props.name === "notifications")!.props.options
      .href,
  ).toBeNull();
});
it("preserves a notification launch destination", () => {
  mockLaunchRoute.mockReturnValue("/notifications");
  render(<TabLayout />);
  expect(router.push).toHaveBeenCalledWith("/notifications");
});
it("uses route indices rather than visible indices for selection and navigation", () => {
  render(<ResponsiveTabBar {...props(5)} />);
  expect(screen.queryByText("Notifications")).toBeNull();
  expect(
    screen.getByLabelText("Profile tab, active").props.accessibilityState
      .selected,
  ).toBe(true);
  fireEvent.press(screen.getByLabelText("Logs tab"));
  expect(mockNavigation.navigate).toHaveBeenCalledWith("logs", undefined);
  expect(mockNavigation.emit).toHaveBeenCalledWith({
    type: "tabPress",
    target: "logs",
    canPreventDefault: true,
  });
  fireEvent(screen.getByLabelText("Logs tab"), "longPress");
  expect(mockNavigation.emit).toHaveBeenCalledWith({
    type: "tabLongPress",
    target: "logs",
  });
});
it.each(["ios", "android"])(
  "gives %s tabs flexible labels and paints the bottom inset",
  (os) => {
    jest.replaceProperty(Platform, "OS", os as any);
    render(<ResponsiveTabBar {...props()} />);
    expect(screen.getByText("Analytics").props.numberOfLines).toBeUndefined();
    const button = screen.getByLabelText("Analytics tab");
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      width: "100%",
      minWidth: 0,
      minHeight: 48,
    });
    const root = screen
      .UNSAFE_getAllByType(View)
      .find(
        (node) => StyleSheet.flatten(node.props.style)?.paddingBottom === 34,
      )!;
    expect(StyleSheet.flatten(root.props.style).backgroundColor).not.toBe(
      "transparent",
    );
  },
);
it.each([false, true])(
  "uses theme colors through the bottom inset with dark mode=%s",
  (dark) => {
    mockDark = dark;
    render(<ResponsiveTabBar {...props()} />);
    const { lightTheme, darkTheme } = require("@/src/design-system");
    const root = screen
      .UNSAFE_getAllByType(View)
      .find(
        (node) => StyleSheet.flatten(node.props.style)?.paddingBottom === 34,
      )!;
    expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(
      (dark ? darkTheme : lightTheme).colors.background,
    );
  },
);
it("gives mobile-web tabs flexible labels and no Notifications tab", () => {
  jest.replaceProperty(Platform, "OS", "web");
  mockLayout.isWeb = true;
  const webProps = props(5);
  render(<ResponsiveTabBar {...webProps} />);
  expect(screen.getByLabelText("Profile tab, active")).toBeTruthy();
  expect(screen.queryByText("Notifications")).toBeNull();
  expect(screen.getByText("Analytics").props.numberOfLines).toBeUndefined();
});
it("does not navigate when a tab event is prevented", () => {
  mockNavigation.emit.mockReturnValueOnce({ defaultPrevented: true });
  render(<ResponsiveTabBar {...props()} />);
  fireEvent.press(screen.getByLabelText("Logs tab"));
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
});
