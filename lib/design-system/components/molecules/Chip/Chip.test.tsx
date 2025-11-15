import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Chip } from "./Chip";

describe("Chip Component", () => {
  // Basic Rendering Tests
  describe("Rendering", () => {
    it("should render with label", () => {
      const { getByText } = render(<Chip label="Tag" />);

      expect(getByText("Tag")).toBeTruthy();
    });

    it("should render with custom label", () => {
      const { getByText } = render(<Chip label="Custom Label" />);

      expect(getByText("Custom Label")).toBeTruthy();
    });
  });

  // Variant Tests
  describe("Variants", () => {
    it("should render default variant", () => {
      const { getByText } = render(<Chip label="Default" variant="default" />);

      expect(getByText("Default")).toBeTruthy();
    });

    it("should render outlined variant", () => {
      const { getByText } = render(
        <Chip label="Outlined" variant="outlined" />,
      );

      expect(getByText("Outlined")).toBeTruthy();
    });

    it("should render filled variant", () => {
      const { getByText } = render(<Chip label="Filled" variant="filled" />);

      expect(getByText("Filled")).toBeTruthy();
    });
  });

  // Size Tests
  describe("Sizes", () => {
    it("should render small size", () => {
      const { getByText } = render(<Chip label="Small" size="sm" />);

      expect(getByText("Small")).toBeTruthy();
    });

    it("should render medium size (default)", () => {
      const { getByText } = render(<Chip label="Medium" size="md" />);

      expect(getByText("Medium")).toBeTruthy();
    });
  });

  // Selection Tests
  describe("Selection", () => {
    it("should render selected state", () => {
      const { getByText } = render(<Chip label="Selected" selected />);

      expect(getByText("Selected")).toBeTruthy();
    });

    it("should toggle selected state on press", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="Selectable" onPress={onPress} />,
      );

      fireEvent.press(getByText("Selectable"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  // Dismissible Tests
  describe("Dismissible", () => {
    it("should render dismiss button when onDismiss is provided", () => {
      const onDismiss = jest.fn();
      const { getByText, getByLabelText } = render(
        <Chip label="Dismissible" onDismiss={onDismiss} />,
      );

      expect(getByText("Dismissible")).toBeTruthy();
      expect(getByLabelText("Dismiss Dismissible")).toBeTruthy();
    });

    it("should call onDismiss when dismiss button is pressed", () => {
      const onDismiss = jest.fn();
      const { getByLabelText } = render(
        <Chip label="Dismissible" onDismiss={onDismiss} />,
      );

      const dismissButton = getByLabelText("Dismiss Dismissible");
      fireEvent.press(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should not render dismiss button without onDismiss", () => {
      const { getByText, queryByLabelText } = render(
        <Chip label="Not Dismissible" />,
      );

      expect(getByText("Not Dismissible")).toBeTruthy();
      expect(queryByLabelText("Dismiss Not Dismissible")).toBeNull();
    });
  });

  // Icon Tests
  describe("Icons", () => {
    it("should render with left icon", () => {
      const { getByText } = render(<Chip label="With Icon" leftIcon="add" />);

      expect(getByText("With Icon")).toBeTruthy();
    });
  });

  // Avatar Tests
  describe("Avatar", () => {
    it("should render with avatar as string", () => {
      const { getByText } = render(
        <Chip label="With Avatar" avatar="https://example.com/avatar.jpg" />,
      );

      expect(getByText("With Avatar")).toBeTruthy();
    });

    it("should render with avatar as image source", () => {
      const avatarSource = { uri: "https://example.com/avatar.jpg" };
      const { getByText } = render(
        <Chip label="With Avatar" avatar={avatarSource} />,
      );

      expect(getByText("With Avatar")).toBeTruthy();
    });
  });

  // Interaction Tests
  describe("Interactions", () => {
    it("should call onPress when pressed", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="Pressable" onPress={onPress} />,
      );

      fireEvent.press(getByText("Pressable"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("should not call onPress when disabled", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="Disabled" onPress={onPress} disabled />,
      );

      fireEvent.press(getByText("Disabled"));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  // State Tests
  describe("States", () => {
    it("should render disabled state", () => {
      const { getByText } = render(<Chip label="Disabled" disabled />);

      expect(getByText("Disabled")).toBeTruthy();
    });

    it("should render both selected and disabled states", () => {
      const { getByText } = render(
        <Chip label="Selected Disabled" selected disabled />,
      );

      expect(getByText("Selected Disabled")).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("should have correct accessibility role when pressable", () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Chip label="Pressable" onPress={onPress} />,
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("should have correct accessibility state when selected", () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Chip label="Selected" onPress={onPress} selected />,
      );

      const chip = getByRole("button");
      expect(chip.props.accessibilityState).toEqual({
        selected: true,
        disabled: false,
      });
    });

    it("should have correct accessibility state when disabled", () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Chip label="Disabled" onPress={onPress} disabled />,
      );

      const chip = getByRole("button");
      expect(chip.props.accessibilityState).toEqual({
        selected: false,
        disabled: true,
      });
    });
  });
});
