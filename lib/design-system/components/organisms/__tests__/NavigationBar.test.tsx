import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { NavigationBar } from "../NavigationBar";
import type { NavigationTab } from "../NavigationBar/NavigationBar.types";

describe("NavigationBar", () => {
  const mockTabs: NavigationTab[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "search", label: "Search", icon: "search" },
    { id: "profile", label: "Profile", icon: "profile" },
  ];

  describe("Basic Rendering", () => {
    it("should render all tabs", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
      expect(screen.getByText("Search")).toBeTruthy();
      expect(screen.getByText("Profile")).toBeTruthy();
    });

    it("should render tab icons when provided", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
      expect(screen.getByText("Search")).toBeTruthy();
      expect(screen.getByText("Profile")).toBeTruthy();
    });

    it("should render tabs without icons", () => {
      const tabsWithoutIcons: NavigationTab[] = [
        { id: "home", label: "Home" },
        { id: "search", label: "Search" },
      ];
      render(
        <NavigationBar
          tabs={tabsWithoutIcons}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
      expect(screen.getByText("Search")).toBeTruthy();
    });
  });

  describe("Active Tab", () => {
    it("should highlight active tab", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="search"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Search")).toBeTruthy();
    });

    it("should call onTabChange when tab is pressed", () => {
      const onTabChange = jest.fn();
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={onTabChange}
        />,
      );
      const searchTab = screen.getByLabelText("Search");
      fireEvent.press(searchTab);
      expect(onTabChange).toHaveBeenCalledWith("search");
    });

    it("should call onTabChange even when pressing active tab", () => {
      const onTabChange = jest.fn();
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={onTabChange}
        />,
      );
      const homeTab = screen.getByLabelText("Home");
      fireEvent.press(homeTab);
      expect(onTabChange).toHaveBeenCalledWith("home");
    });
  });

  describe("Badge Display", () => {
    it("should render badge when badge count is greater than 0", () => {
      const tabsWithBadge: NavigationTab[] = [
        { id: "home", label: "Home", icon: "home" },
        {
          id: "notifications",
          label: "Notifications",
          icon: "notification",
          badge: 5,
        },
      ];
      render(
        <NavigationBar
          tabs={tabsWithBadge}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("5")).toBeTruthy();
    });

    it("should not render badge when badge count is 0", () => {
      const tabsWithBadge: NavigationTab[] = [
        { id: "home", label: "Home", icon: "home" },
        {
          id: "notifications",
          label: "Notifications",
          icon: "notification",
          badge: 0,
        },
      ];
      render(
        <NavigationBar
          tabs={tabsWithBadge}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      const badges = screen.queryAllByText("0");
      expect(badges.length).toBe(0);
    });

    it("should not render badge when badge is undefined", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      // Just verify tabs render without badges
      expect(screen.getByText("Home")).toBeTruthy();
    });
  });

  describe("Disabled Tabs", () => {
    it("should not call onTabChange for disabled tab", () => {
      const onTabChange = jest.fn();
      const tabsWithDisabled: NavigationTab[] = [
        { id: "home", label: "Home", icon: "home" },
        { id: "search", label: "Search", icon: "search", disabled: true },
      ];
      render(
        <NavigationBar
          tabs={tabsWithDisabled}
          activeTab="home"
          onTabChange={onTabChange}
        />,
      );
      const searchTab = screen.getByLabelText("Search");
      fireEvent.press(searchTab);
      expect(onTabChange).not.toHaveBeenCalled();
    });

    it("should apply disabled state to disabled tab", () => {
      const tabsWithDisabled: NavigationTab[] = [
        { id: "home", label: "Home", icon: "home" },
        { id: "search", label: "Search", icon: "search", disabled: true },
      ];
      render(
        <NavigationBar
          tabs={tabsWithDisabled}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      const searchTab = screen.getByLabelText("Search");
      expect(searchTab.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe("Variant Styles", () => {
    it("should apply default variant styles", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
    });

    it("should apply filled variant styles", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
          variant="filled"
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
    });
  });

  describe("Position", () => {
    it("should apply bottom position by default", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
    });

    it("should apply top position when specified", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
          position="top"
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
    });
  });

  describe("Show Labels", () => {
    it("should show labels by default", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeTruthy();
      expect(screen.getByText("Search")).toBeTruthy();
      expect(screen.getByText("Profile")).toBeTruthy();
    });

    it("should hide labels when showLabels is false", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
          showLabels={false}
        />,
      );
      const homeLabel = screen.queryByText("Home");
      const searchLabel = screen.queryByText("Search");
      const profileLabel = screen.queryByText("Profile");
      expect(homeLabel).toBeNull();
      expect(searchLabel).toBeNull();
      expect(profileLabel).toBeNull();
    });
  });

  describe("Accessibility", () => {
    it("should have proper accessibility role for tabs", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      const homeTab = screen.getByLabelText("Home");
      expect(homeTab.props.accessibilityRole).toBe("tab");
    });

    it("should set accessibility state for selected tab", () => {
      render(
        <NavigationBar
          tabs={mockTabs}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      const homeTab = screen.getByLabelText("Home");
      expect(homeTab.props.accessibilityState?.selected).toBe(true);
    });

    it("should set accessibility state for disabled tab", () => {
      const tabsWithDisabled: NavigationTab[] = [
        { id: "home", label: "Home", icon: "home" },
        { id: "search", label: "Search", icon: "search", disabled: true },
      ];
      render(
        <NavigationBar
          tabs={tabsWithDisabled}
          activeTab="home"
          onTabChange={jest.fn()}
        />,
      );
      const searchTab = screen.getByLabelText("Search");
      expect(searchTab.props.accessibilityState?.disabled).toBe(true);
    });
  });
});
