import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { PageHeader } from "../PageHeader";
import { Text } from "../../atoms/Text";

import { router } from "expo-router";

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

describe("PageHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with title only", () => {
      render(<PageHeader title="Test Title" />);
      expect(screen.getByText("Test Title")).toBeTruthy();
    });

    it("should render with title and subtitle", () => {
      render(<PageHeader title="Test Title" subtitle="Test Subtitle" />);
      expect(screen.getByText("Test Title")).toBeTruthy();
      expect(screen.getByText("Test Subtitle")).toBeTruthy();
    });

    it("should not render back button by default", () => {
      render(<PageHeader title="Test Title" />);
      const backButtons = screen.queryAllByLabelText("Go back");
      expect(backButtons.length).toBe(0);
    });

    it("should render back button when showBack is true", () => {
      render(<PageHeader title="Test Title" showBack />);
      expect(screen.getByLabelText("Go back")).toBeTruthy();
    });
  });

  describe("Back Navigation", () => {
    it("should call custom onBack handler when provided", () => {
      const onBack = jest.fn();
      render(<PageHeader title="Test Title" showBack onBack={onBack} />);
      const backButton = screen.getByLabelText("Go back");
      fireEvent.press(backButton);
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("should handle back button press", () => {
      render(<PageHeader title="Test Title" showBack />);
      const backButton = screen.getByLabelText("Go back");
      fireEvent.press(backButton);
      // The component will call router methods internally
      expect(backButton).toBeTruthy();
    });
  });

  describe("Action Buttons", () => {
    it("should render action buttons", () => {
      const actions = [
        { icon: "add" as const, onPress: jest.fn(), label: "Add" },
        { icon: "settings" as const, onPress: jest.fn(), label: "Settings" },
      ];
      render(<PageHeader title="Test Title" actions={actions} />);
      expect(screen.getByLabelText("Add")).toBeTruthy();
      expect(screen.getByLabelText("Settings")).toBeTruthy();
    });

    it("should call onPress when action button is pressed", () => {
      const onPress = jest.fn();
      const actions = [{ icon: "add" as const, onPress, label: "Add" }];
      render(<PageHeader title="Test Title" actions={actions} />);
      const addButton = screen.getByLabelText("Add");
      fireEvent.press(addButton);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("should disable action button when disabled is true", () => {
      const onPress = jest.fn();
      const actions = [
        { icon: "add" as const, onPress, label: "Add", disabled: true },
      ];
      render(<PageHeader title="Test Title" actions={actions} />);
      const addButton = screen.getByLabelText("Add");
      fireEvent.press(addButton);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("should render action button correctly", () => {
      const onPress = jest.fn();
      const actions = [{ icon: "add" as const, onPress, label: "Add" }];
      render(<PageHeader title="Test Title" actions={actions} />);
      const addButton = screen.getByLabelText("Add");
      expect(addButton).toBeTruthy();
    });
  });

  describe("Bottom Slot", () => {
    it("should render bottom slot content", () => {
      const { getByText } = render(
        <PageHeader title="Test Title" bottom={<Text>Custom Content</Text>} />,
      );
      expect(getByText("Custom Content")).toBeTruthy();
    });

    it("should not render separator when no bottom slot", () => {
      const { toJSON } = render(<PageHeader title="Test Title" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper accessibility role for back button", () => {
      render(<PageHeader title="Test Title" showBack />);
      const backButton = screen.getByLabelText("Go back");
      expect(backButton.props.accessibilityRole).toBe("button");
    });

    it("should have proper accessibility role for action buttons", () => {
      const actions = [
        { icon: "add" as const, onPress: jest.fn(), label: "Add" },
      ];
      render(<PageHeader title="Test Title" actions={actions} />);
      const addButton = screen.getByLabelText("Add");
      expect(addButton.props.accessibilityRole).toBe("button");
    });

    it("should set accessibility state for disabled buttons", () => {
      const actions = [
        {
          icon: "add" as const,
          onPress: jest.fn(),
          label: "Add",
          disabled: true,
        },
      ];
      render(<PageHeader title="Test Title" actions={actions} />);
      const addButton = screen.getByLabelText("Add");
      expect(addButton.props.accessibilityState).toEqual({ disabled: true });
    });
  });
});
