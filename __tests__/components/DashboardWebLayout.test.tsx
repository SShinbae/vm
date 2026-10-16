import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import { DashboardWebLayout } from "@/components/layout/DashboardWebLayout";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const mockLayout = { isWeb: true, isMobile: false };
let mockFocused = true;
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockFocused,
}));
jest.mock("@/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: jest.fn(),
}));
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
jest.mock("@/components/layout/WebPageHeader", () => ({
  WebPageHeader: () => {
    const { Text } = require("react-native");
    return <Text>Shared header</Text>;
  },
}));
jest.mock("@/components/navigation/WebSidebar", () => ({
  WebSidebar: () => {
    const { useSidebar } = require("@/lib/contexts/SidebarContext");
    const { Pressable, Text } = require("react-native");
    const { toggle, isOpen } = useSidebar();
    return (
      <Pressable onPress={toggle}>
        <Text>Toggle sidebar</Text>
        <Text>{isOpen ? "Expanded" : "Collapsed"}</Text>
      </Pressable>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLayout.isWeb = true;
  mockLayout.isMobile = false;
  mockFocused = true;
});

it("shares sidebar state across layouts", () => {
  const { rerender } = render(
    <SidebarProvider>
      <DashboardWebLayout>
        <View testID="tabs" />
      </DashboardWebLayout>
    </SidebarProvider>,
  );
  expect(screen.getAllByText("Shared header")).toHaveLength(1);
  fireEvent.press(screen.getByText("Toggle sidebar"));
  const props = (useKeyboardShortcuts as jest.Mock).mock.calls.at(-1)[0];
  expect(props.enabled).toBe(true);
  rerender(
    <SidebarProvider>
      <DashboardWebLayout key="groups">
        <View testID="groups" />
      </DashboardWebLayout>
    </SidebarProvider>,
  );
  expect(screen.getByText("Collapsed")).toBeTruthy();
});

it("omits the desktop controls on mobile and disables inactive shortcuts", () => {
  mockLayout.isMobile = true;
  const { rerender } = render(
    <SidebarProvider>
      <DashboardWebLayout>
        <View />
      </DashboardWebLayout>
    </SidebarProvider>,
  );
  expect(screen.queryByText("Shared header")).toBeNull();
  expect(screen.queryByText("Toggle sidebar")).toBeNull();
  mockLayout.isMobile = false;
  mockFocused = false;
  rerender(
    <SidebarProvider>
      <DashboardWebLayout showHeader={false}>
        <View />
      </DashboardWebLayout>
    </SidebarProvider>,
  );
  expect(screen.queryByText("Shared header")).toBeNull();
  expect((useKeyboardShortcuts as jest.Mock).mock.calls.at(-1)[0].enabled).toBe(
    false,
  );
});
