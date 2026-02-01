import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { Text } from "../../atoms/Text";
import { DetailLayout } from "../DetailLayout";

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

describe("DetailLayout", () => {
  const defaultProps = {
    header: { title: "Details" },
  };

  describe("Basic Rendering", () => {
    it("should render header", () => {
      render(<DetailLayout {...defaultProps} />);
      expect(screen.getByText("Details")).toBeTruthy();
    });

    it("should render hero section", () => {
      render(
        <DetailLayout {...defaultProps} hero={<Text>Hero Content</Text>} />,
      );
      expect(screen.getByText("Hero Content")).toBeTruthy();
    });

    it("should render related items", () => {
      render(
        <DetailLayout
          {...defaultProps}
          relatedItems={<Text>Related Items</Text>}
        />,
      );
      expect(screen.getByText("Related Items")).toBeTruthy();
    });

    it("should render actions", () => {
      render(
        <DetailLayout
          {...defaultProps}
          actions={<Text>Action Buttons</Text>}
        />,
      );
      expect(screen.getByText("Action Buttons")).toBeTruthy();
    });
  });

  describe("Tabs", () => {
    const tabs = [
      { id: "tab1", label: "Tab 1", content: <Text>Content 1</Text> },
      { id: "tab2", label: "Tab 2", content: <Text>Content 2</Text> },
      { id: "tab3", label: "Tab 3", content: <Text>Content 3</Text>, badge: 5 },
    ];

    it("should render all tabs", () => {
      render(<DetailLayout {...defaultProps} tabs={tabs} />);
      expect(screen.getByText("Tab 1")).toBeTruthy();
      expect(screen.getByText("Tab 2")).toBeTruthy();
      expect(screen.getByText("Tab 3")).toBeTruthy();
    });

    it("should show first tab content by default", () => {
      render(<DetailLayout {...defaultProps} tabs={tabs} />);
      expect(screen.getByText("Content 1")).toBeTruthy();
      expect(screen.queryByText("Content 2")).toBeNull();
    });

    it("should switch tabs when pressed", () => {
      render(<DetailLayout {...defaultProps} tabs={tabs} />);
      const tab2 = screen.getByText("Tab 2");
      fireEvent.press(tab2);
      expect(screen.getByText("Content 2")).toBeTruthy();
      expect(screen.queryByText("Content 1")).toBeNull();
    });

    it("should show badge on tab", () => {
      render(<DetailLayout {...defaultProps} tabs={tabs} />);
      expect(screen.getByText("5")).toBeTruthy();
    });

    it("should call onTabChange when tab is pressed", () => {
      const onTabChange = jest.fn();
      render(
        <DetailLayout
          {...defaultProps}
          tabs={tabs}
          onTabChange={onTabChange}
        />,
      );
      const tab2 = screen.getByText("Tab 2");
      fireEvent.press(tab2);
      expect(onTabChange).toHaveBeenCalledWith("tab2");
    });
  });

  describe("Accessibility", () => {
    it("should have proper tab accessibility", () => {
      const tabs = [
        { id: "tab1", label: "Tab 1", content: <Text>Content 1</Text> },
      ];
      render(<DetailLayout {...defaultProps} tabs={tabs} />);
      // Find by accessibility label which is set on the TouchableOpacity
      const tab = screen.getByLabelText("Tab 1");
      expect(tab.props.accessibilityRole).toBe("tab");
      expect(tab.props.accessibilityState).toEqual({ selected: true });
    });
  });
});
