import React from "react";
import { Button, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import {
  renderRouter,
  screen,
  fireEvent,
  waitFor,
  act,
} from "expo-router/testing-library";
import TabLayout from "@/app/(tabs)/_layout";
import Notifications from "@/app/(tabs)/notifications";

jest.unmock("expo-router");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({
    isWeb: false,
    isMobile: true,
    isDesktop: false,
  }),
}));
jest.mock("@/components/layout/DashboardWebLayout", () => ({
  DashboardWebLayout: ({ children }: any) => <>{children}</>,
}));
jest.mock("@/components/navigation/ResponsiveTabBar", () => ({
  ResponsiveTabBar: ({ navigation }: any) => {
    const { Button, View } = require("react-native");
    return (
      <View>
        <Button
          title="Go Profile"
          onPress={() => navigation.navigate("profile")}
        />
        <Button title="Go Logs" onPress={() => navigation.navigate("logs")} />
      </View>
    );
  },
}));
jest.mock("@/components/ui/NotificationList", () => ({
  NotificationList: () => null,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "one" } }),
}));
const mockRefresh = jest.fn(async () => {});
const mockNotifications: any[] = [];
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: 0,
    notifications: mockNotifications,
    refreshNotifications: mockRefresh,
    markAllAsRead: jest.fn(),
    isMarkingRead: false,
  }),
}));
jest.mock("@/lib/services/pushService", () => ({
  pushService: { consumeLaunchRoute: () => null },
}));
jest.mock("@/lib/services/groupService", () => ({
  GroupInvitationService: {
    getUserInvitations: jest.fn(async () => ({ data: [], error: null })),
  },
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
  }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ choose: jest.fn() }),
}));

function Origin({ name }: { name: string }) {
  const [count, setCount] = React.useState(0);
  return (
    <View>
      <Text>{name}</Text>
      <Text>{`Draft ${count}`}</Text>
      <Button
        title="Edit draft"
        onPress={() => setCount((value) => value + 1)}
      />
      <Button
        title="Open notifications"
        onPress={() => router.push("/notifications")}
      />
    </View>
  );
}
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  "(tabs)/_layout": TabLayout,
  "(tabs)/index": () => <Origin name="Home screen" />,
  "(tabs)/profile": () => <Origin name="Profile screen" />,
  "(tabs)/logs": () => <Origin name="Logs screen" />,
  "(tabs)/vehicles": () => <Origin name="Vehicles screen" />,
  "(tabs)/analytics": () => <Origin name="Analytics screen" />,
  "(tabs)/notifications": Notifications,
  "groups/[id]": () => <Origin name="Group details" />,
};
afterEach(() => jest.useRealTimers());
it.each(["/profile", "/logs", "/vehicles", "/analytics"])(
  "returns Notifications Back to its opening tab %s, preserving its state",
  async (path) => {
    const result = renderRouter(routes, { initialUrl: path });
    fireEvent.press(screen.getByText("Edit draft"));
    fireEvent.press(screen.getByText("Open notifications"));
    await waitFor(() => expect(result.getPathname()).toBe("/notifications"));
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(result.getPathname()).toBe(path));
    expect(screen.getByText("Draft 1")).toBeTruthy();
  },
);
it("returns to the latest opening tab on repeated visits", async () => {
  const result = renderRouter(routes, { initialUrl: "/" });
  fireEvent.press(screen.getByText("Go Profile"));
  fireEvent.press(screen.getByText("Open notifications"));
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/profile"));
  fireEvent.press(screen.getByText("Go Logs"));
  fireEvent.press(screen.getByText("Open notifications"));
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/logs"));
});
it("returns to the opening tab for navigation Back actions too", async () => {
  const result = renderRouter(routes, { initialUrl: "/profile" });
  fireEvent.press(screen.getByText("Open notifications"));
  await act(async () => router.back());
  await waitFor(() => expect(result.getPathname()).toBe("/profile"));
});
it("returns to a stack screen that opened Notifications", async () => {
  const result = renderRouter(routes, { initialUrl: "/groups/one" });
  fireEvent.press(screen.getByText("Open notifications"));
  await waitFor(() => expect(result.getPathname()).toBe("/notifications"));
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups/one"));
});
it("still falls back to Home after opening Notifications directly", async () => {
  const result = renderRouter(routes, { initialUrl: "/notifications" });
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/"));
});
