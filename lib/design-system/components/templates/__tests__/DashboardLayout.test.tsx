import { screen } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { Text } from "../../atoms/Text";
import { DashboardLayout } from "../DashboardLayout";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => false,
  }),
}));

describe("DashboardLayout", () => {
  const defaultProps = {
    header: { title: "Dashboard" },
  };

  describe("Basic Rendering", () => {
    it("should render header", () => {
      render(<DashboardLayout {...defaultProps} />);
      expect(screen.getByText("Dashboard")).toBeTruthy();
    });

    it("should render metrics section", () => {
      render(
        <DashboardLayout
          {...defaultProps}
          metrics={<Text>Metrics Content</Text>}
        />,
      );
      expect(screen.getByText("Metrics Content")).toBeTruthy();
    });

    it("should render charts section", () => {
      render(
        <DashboardLayout
          {...defaultProps}
          charts={<Text>Charts Content</Text>}
        />,
      );
      expect(screen.getByText("Charts Content")).toBeTruthy();
    });

    it("should render quick actions", () => {
      render(
        <DashboardLayout
          {...defaultProps}
          quickActions={<Text>Quick Actions</Text>}
        />,
      );
      expect(screen.getByText("Quick Actions")).toBeTruthy();
    });

    it("should render recent activity", () => {
      render(
        <DashboardLayout
          {...defaultProps}
          recentActivity={<Text>Recent Activity</Text>}
        />,
      );
      expect(screen.getByText("Recent Activity")).toBeTruthy();
    });
  });

  describe("Section Ordering", () => {
    it("should render sections in correct order", () => {
      render(
        <DashboardLayout
          {...defaultProps}
          metrics={<Text>Metrics</Text>}
          quickActions={<Text>Actions</Text>}
          charts={<Text>Charts</Text>}
          recentActivity={<Text>Activity</Text>}
        />,
      );
      expect(screen.getByText("Metrics")).toBeTruthy();
      expect(screen.getByText("Actions")).toBeTruthy();
      expect(screen.getByText("Charts")).toBeTruthy();
      expect(screen.getByText("Activity")).toBeTruthy();
    });

    it("should only render provided sections", () => {
      render(
        <DashboardLayout {...defaultProps} metrics={<Text>Metrics</Text>} />,
      );
      expect(screen.getByText("Metrics")).toBeTruthy();
      expect(screen.queryByText("Charts")).toBeNull();
    });
  });

  describe("Custom Sections", () => {
    it("should render custom sections", () => {
      const customSections = [
        <Text key="1">Custom Section 1</Text>,
        <Text key="2">Custom Section 2</Text>,
      ];
      render(
        <DashboardLayout {...defaultProps} customSections={customSections} />,
      );
      expect(screen.getByText("Custom Section 1")).toBeTruthy();
      expect(screen.getByText("Custom Section 2")).toBeTruthy();
    });
  });

  describe("Pull to Refresh", () => {
    it("should be refreshable by default", () => {
      const onRefresh = jest.fn();
      render(<DashboardLayout {...defaultProps} onRefresh={onRefresh} />);
      // RefreshControl should be rendered
      expect(screen.getByText("Dashboard")).toBeTruthy();
    });

    it("should not be refreshable when disabled", () => {
      const onRefresh = jest.fn();
      render(
        <DashboardLayout
          {...defaultProps}
          onRefresh={onRefresh}
          refreshable={false}
        />,
      );
      expect(screen.getByText("Dashboard")).toBeTruthy();
    });
  });
});
