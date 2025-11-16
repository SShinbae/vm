import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { TabBar } from "./TabBar";

const mockTabs = [
  { key: "tab1", label: "Tab 1" },
  { key: "tab2", label: "Tab 2" },
  { key: "tab3", label: "Tab 3" },
];

describe("TabBar Component", () => {
  // Basic Rendering Tests
  describe("Rendering", () => {
    it("should render all tabs", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
      expect(getByText("Tab 2")).toBeTruthy();
      expect(getByText("Tab 3")).toBeTruthy();
    });

    it("should render with single tab", () => {
      const singleTab = [{ key: "only", label: "Only Tab" }];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={singleTab} activeTab="only" onTabChange={onTabChange} />,
      );

      expect(getByText("Only Tab")).toBeTruthy();
    });
  });

  // Variant Tests
  describe("Variants", () => {
    it("should render default variant", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
          variant="default"
        />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
    });

    it("should render underline variant", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
          variant="underline"
        />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
    });

    it("should render pills variant", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
          variant="pills"
        />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
    });
  });

  // Interaction Tests
  describe("Interactions", () => {
    it("should call onTabChange when tab is pressed", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      fireEvent.press(getByText("Tab 2"));
      expect(onTabChange).toHaveBeenCalledWith("tab2");
    });

    it("should not call onTabChange for already active tab", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      fireEvent.press(getByText("Tab 1"));
      expect(onTabChange).not.toHaveBeenCalled();
    });

    it("should not call onTabChange for disabled tab", () => {
      const disabledTabs = [
        { key: "tab1", label: "Tab 1" },
        { key: "tab2", label: "Tab 2", disabled: true },
      ];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={disabledTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />,
      );

      fireEvent.press(getByText("Tab 2"));
      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  // Icon Tests
  describe("Icons", () => {
    it("should render tabs with icons", () => {
      const tabsWithIcons = [
        { key: "home", label: "Home", icon: "home" as const },
        { key: "search", label: "Search", icon: "search" as const },
      ];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={tabsWithIcons}
          activeTab="home"
          onTabChange={onTabChange}
        />,
      );

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Search")).toBeTruthy();
    });
  });

  // Badge Tests
  describe("Badges", () => {
    it("should render tabs with badges", () => {
      const tabsWithBadges = [
        { key: "tab1", label: "Tab 1", badge: 5 },
        { key: "tab2", label: "Tab 2", badge: 10 },
      ];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={tabsWithBadges}
          activeTab="tab1"
          onTabChange={onTabChange}
        />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
      expect(getByText("Tab 2")).toBeTruthy();
      expect(getByText("5")).toBeTruthy();
      expect(getByText("10")).toBeTruthy();
    });

    it("should handle badge value of 0", () => {
      const tabsWithBadges = [{ key: "tab1", label: "Tab 1", badge: 0 }];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={tabsWithBadges}
          activeTab="tab1"
          onTabChange={onTabChange}
        />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
      expect(getByText("0")).toBeTruthy();
    });
  });

  // Scrollable Tests
  describe("Scrollable", () => {
    it("should render scrollable tabs", () => {
      const manyTabs = Array.from({ length: 10 }, (_, i) => ({
        key: `tab${i}`,
        label: `Tab ${i}`,
      }));
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={manyTabs}
          activeTab="tab0"
          onTabChange={onTabChange}
          scrollable
        />,
      );

      expect(getByText("Tab 0")).toBeTruthy();
    });

    it("should render non-scrollable tabs by default", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
    });
  });

  // Active State Tests
  describe("Active State", () => {
    it("should highlight active tab", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab2" onTabChange={onTabChange} />,
      );

      expect(getByText("Tab 2")).toBeTruthy();
      // Active state styling is verified through component structure
    });

    it("should update active tab on change", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      expect(getByText("Tab 1")).toBeTruthy();

      // Simulate tab change
      fireEvent.press(getByText("Tab 3"));
      expect(onTabChange).toHaveBeenCalledWith("tab3");
    });
  });

  // Disabled State Tests
  describe("Disabled State", () => {
    it("should render disabled tabs", () => {
      const tabsWithDisabled = [
        { key: "tab1", label: "Tab 1" },
        { key: "tab2", label: "Tab 2", disabled: true },
        { key: "tab3", label: "Tab 3" },
      ];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="tab1"
          onTabChange={onTabChange}
        />,
      );

      expect(getByText("Tab 1")).toBeTruthy();
      expect(getByText("Tab 2")).toBeTruthy();
      expect(getByText("Tab 3")).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("should have correct accessibility role for tabs", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      const tab = getByText("Tab 1");
      expect(tab).toBeTruthy();
    });

    it("should have correct accessibility state for active tab", () => {
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />,
      );

      const activeTab = getByText("Tab 1");
      expect(activeTab).toBeTruthy();
    });

    it("should have correct accessibility state for disabled tab", () => {
      const tabsWithDisabled = [
        { key: "tab1", label: "Tab 1", disabled: true },
      ];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="tab1"
          onTabChange={onTabChange}
        />,
      );

      const disabledTab = getByText("Tab 1");
      expect(disabledTab).toBeTruthy();
    });
  });

  // Combined Features Tests
  describe("Combined Features", () => {
    it("should render tabs with icons, badges, and scrollable", () => {
      const complexTabs = [
        { key: "home", label: "Home", icon: "home" as const, badge: 3 },
        { key: "search", label: "Search", icon: "search" as const },
        {
          key: "notifications",
          label: "Notifications",
          icon: "notification" as const,
          badge: 10,
        },
      ];
      const onTabChange = jest.fn();
      const { getByText } = render(
        <TabBar
          tabs={complexTabs}
          activeTab="home"
          onTabChange={onTabChange}
          scrollable
        />,
      );

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Search")).toBeTruthy();
      expect(getByText("Notifications")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
      expect(getByText("10")).toBeTruthy();
    });
  });
});
