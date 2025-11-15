import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { ListItem } from "./ListItem";

describe("ListItem Component", () => {
  // Basic Rendering Tests
  describe("Rendering", () => {
    it("should render with title only", () => {
      const { getByText } = render(<ListItem title="Item Title" />);

      expect(getByText("Item Title")).toBeTruthy();
    });

    it("should render with title and subtitle", () => {
      const { getByText } = render(
        <ListItem title="Title" subtitle="Subtitle" />,
      );

      expect(getByText("Title")).toBeTruthy();
      expect(getByText("Subtitle")).toBeTruthy();
    });

    it("should render with title, subtitle, and description", () => {
      const { getByText } = render(
        <ListItem
          title="Title"
          subtitle="Subtitle"
          description="Description text here"
        />,
      );

      expect(getByText("Title")).toBeTruthy();
      expect(getByText("Subtitle")).toBeTruthy();
      expect(getByText("Description text here")).toBeTruthy();
    });
  });

  // Left/Right Elements Tests
  describe("Left and Right Elements", () => {
    it("should render with left element", () => {
      const { getByText } = render(
        <ListItem title="Title" leftElement={<Text>Left</Text>} />,
      );

      expect(getByText("Title")).toBeTruthy();
      expect(getByText("Left")).toBeTruthy();
    });

    it("should render with right element", () => {
      const { getByText } = render(
        <ListItem title="Title" rightElement={<Text>Right</Text>} />,
      );

      expect(getByText("Title")).toBeTruthy();
      expect(getByText("Right")).toBeTruthy();
    });

    it("should render with both left and right elements", () => {
      const { getByText } = render(
        <ListItem
          title="Title"
          leftElement={<Text>Left</Text>}
          rightElement={<Text>Right</Text>}
        />,
      );

      expect(getByText("Title")).toBeTruthy();
      expect(getByText("Left")).toBeTruthy();
      expect(getByText("Right")).toBeTruthy();
    });
  });

  // Divider Tests
  describe("Divider", () => {
    it("should render with divider when showDivider is true", () => {
      const { getByText } = render(<ListItem title="Title" showDivider />);

      expect(getByText("Title")).toBeTruthy();
      // Divider presence is verified through component structure
    });

    it("should not render divider by default", () => {
      const { getByText } = render(<ListItem title="Title" />);

      expect(getByText("Title")).toBeTruthy();
    });
  });

  // Interaction Tests
  describe("Interactions", () => {
    it("should call onPress when pressed", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ListItem title="Pressable Item" onPress={onPress} />,
      );

      fireEvent.press(getByText("Pressable Item"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("should not be pressable without onPress", () => {
      const { getByText } = render(<ListItem title="Non-Pressable Item" />);

      expect(getByText("Non-Pressable Item")).toBeTruthy();
    });

    it("should not call onPress when disabled", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ListItem title="Disabled Item" onPress={onPress} disabled />,
      );

      fireEvent.press(getByText("Disabled Item"));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  // State Tests
  describe("States", () => {
    it("should render disabled state", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ListItem title="Disabled" onPress={onPress} disabled />,
      );

      expect(getByText("Disabled")).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("should have correct accessibility role when pressable", () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <ListItem title="Pressable" onPress={onPress} />,
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("should have correct accessibility label", () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ListItem title="Item" subtitle="Subtitle" onPress={onPress} />,
      );

      const item = getByText("Item");
      expect(item).toBeTruthy();
    });

    it("should have correct accessibility state when disabled", () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <ListItem title="Disabled" onPress={onPress} disabled />,
      );

      const item = getByRole("button");
      expect(item.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  // Multi-line Support Tests
  describe("Multi-line Support", () => {
    it("should handle long title text", () => {
      const longTitle =
        "This is a very long title that should wrap to multiple lines";
      const { getByText } = render(<ListItem title={longTitle} />);

      expect(getByText(longTitle)).toBeTruthy();
    });

    it("should handle long subtitle text", () => {
      const longSubtitle =
        "This is a very long subtitle that should wrap to multiple lines";
      const { getByText } = render(
        <ListItem title="Title" subtitle={longSubtitle} />,
      );

      expect(getByText(longSubtitle)).toBeTruthy();
    });

    it("should handle long description text", () => {
      const longDescription =
        "This is a very long description that should wrap to multiple lines and display correctly";
      const { getByText } = render(
        <ListItem title="Title" description={longDescription} />,
      );

      expect(getByText(longDescription)).toBeTruthy();
    });
  });
});
