/**
 * ServiceItemsInput Component Tests
 *
 * Tests for the service items input component covering
 * add/remove items, cost calculation, validation, and readonly mode.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { ServiceItemsInput } from "@/components/ui/ServiceItemsInput";

// Mock dependencies
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name, testID }: { name: string; testID?: string }) => {
    return <Text testID={testID || `icon-${name}`}>{name}</Text>;
  },
}));

describe("ServiceItemsInput", () => {
  const mockItems = [
    { description: "Oil Filter", price: 25 },
    { description: "Labor", price: 50 },
  ];

  const defaultProps = {
    items: mockItems,
    onItemsChange: jest.fn(),
    readonly: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all items", () => {
      const { getAllByPlaceholderText } = render(
        <ServiceItemsInput {...defaultProps} />,
      );

      const descriptionInputs = getAllByPlaceholderText(
        "Service description...",
      );
      expect(descriptionInputs).toHaveLength(2);
    });

    it("should display label with required indicator", () => {
      const { getByText } = render(<ServiceItemsInput {...defaultProps} />);

      // The label contains "Service Items " with a nested Text for "*"
      expect(getByText(/Service Items/)).toBeTruthy();
      expect(getByText("*")).toBeTruthy();
    });

    it("should show add item button", () => {
      const { getByText } = render(<ServiceItemsInput {...defaultProps} />);

      expect(getByText("Add Item")).toBeTruthy();
    });

    it("should display total cost", () => {
      const { getByText } = render(<ServiceItemsInput {...defaultProps} />);

      expect(getByText("Total Cost")).toBeTruthy();
      expect(getByText("RM75.00")).toBeTruthy();
    });
  });

  describe("Add Items", () => {
    it("should call onItemsChange with new item when add button pressed", () => {
      const onItemsChange = jest.fn();
      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} onItemsChange={onItemsChange} />,
      );

      fireEvent.press(getByText("Add Item"));

      expect(onItemsChange).toHaveBeenCalledWith([
        ...mockItems,
        { description: "", price: 0 },
      ]);
    });
  });

  describe("Remove Items", () => {
    it("should call onItemsChange without removed item", () => {
      const onItemsChange = jest.fn();
      const { getAllByTestId } = render(
        <ServiceItemsInput {...defaultProps} onItemsChange={onItemsChange} />,
      );

      // Find remove buttons
      const removeButtons = getAllByTestId("icon-minus.circle.fill");
      fireEvent.press(removeButtons[0]);

      expect(onItemsChange).toHaveBeenCalledWith([mockItems[1]]);
    });

    it("should maintain minimum 1 item", () => {
      const onItemsChange = jest.fn();
      const singleItem = [{ description: "Only Item", price: 50 }];

      const { getByTestId } = render(
        <ServiceItemsInput
          {...defaultProps}
          items={singleItem}
          onItemsChange={onItemsChange}
        />,
      );

      // Try to remove the only item - button should be disabled
      const removeButton = getByTestId("icon-minus.circle.fill");
      fireEvent.press(removeButton);

      // Should not have been called since button is disabled
      expect(onItemsChange).not.toHaveBeenCalled();
    });
  });

  describe("Real-time Cost Calculation", () => {
    it("should calculate total from all items", () => {
      const items = [
        { description: "Item 1", price: 100 },
        { description: "Item 2", price: 50 },
        { description: "Item 3", price: 25 },
      ];

      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} items={items} />,
      );

      expect(getByText("RM175.00")).toBeTruthy();
    });

    it("should handle zero prices", () => {
      const items = [
        { description: "Free Item", price: 0 },
        { description: "Paid Item", price: 100 },
      ];

      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} items={items} />,
      );

      expect(getByText("RM100.00")).toBeTruthy();
    });

    it("should handle empty items array", () => {
      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} items={[]} />,
      );

      expect(getByText("RM0.00")).toBeTruthy();
    });
  });

  describe("Item Updates", () => {
    it("should call onItemsChange when description changed", () => {
      const onItemsChange = jest.fn();
      const { getAllByPlaceholderText } = render(
        <ServiceItemsInput {...defaultProps} onItemsChange={onItemsChange} />,
      );

      const descriptionInputs = getAllByPlaceholderText(
        "Service description...",
      );
      fireEvent.changeText(descriptionInputs[0], "New Description");

      expect(onItemsChange).toHaveBeenCalledWith([
        { description: "New Description", price: 25 },
        { description: "Labor", price: 50 },
      ]);
    });

    it("should call onItemsChange when price changed", () => {
      const onItemsChange = jest.fn();
      const { getAllByPlaceholderText } = render(
        <ServiceItemsInput {...defaultProps} onItemsChange={onItemsChange} />,
      );

      const priceInputs = getAllByPlaceholderText("0.00");
      fireEvent.changeText(priceInputs[0], "35");

      expect(onItemsChange).toHaveBeenCalledWith([
        { description: "Oil Filter", price: 35 },
        { description: "Labor", price: 50 },
      ]);
    });
  });

  describe("Readonly Mode", () => {
    it("should not have input fields when readonly", () => {
      const { queryAllByPlaceholderText } = render(
        <ServiceItemsInput {...defaultProps} readonly={true} />,
      );

      const inputs = queryAllByPlaceholderText("Service description...");
      expect(inputs).toHaveLength(0);
    });

    it("should not show add button when readonly", () => {
      const { queryByText } = render(
        <ServiceItemsInput {...defaultProps} readonly={true} />,
      );

      expect(queryByText("Add Item")).toBeNull();
    });

    it("should not show required indicator when readonly", () => {
      const { queryByText, getByText } = render(
        <ServiceItemsInput {...defaultProps} readonly={true} />,
      );

      expect(getByText(/Service Items/)).toBeTruthy();
      expect(queryByText("*")).toBeNull();
    });

    it("should still display total when readonly", () => {
      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} readonly={true} />,
      );

      expect(getByText("Total Cost")).toBeTruthy();
      expect(getByText("RM75.00")).toBeTruthy();
    });
  });

  describe("Display Formatting", () => {
    it("should display prices with two decimal places in total", () => {
      const items = [{ description: "Item", price: 99.999 }];

      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} items={items} />,
      );

      expect(getByText("RM100.00")).toBeTruthy();
    });

    it("should show RM prefix for total", () => {
      const { getByText } = render(<ServiceItemsInput {...defaultProps} />);

      expect(getByText(/^RM/)).toBeTruthy();
    });
  });

  describe("Validation", () => {
    it("should handle items with empty description", () => {
      const items = [
        { description: "", price: 50 },
        { description: "Valid Item", price: 25 },
      ];

      const { getAllByPlaceholderText } = render(
        <ServiceItemsInput {...defaultProps} items={items} />,
      );

      // Should still render both items
      expect(getAllByPlaceholderText("Service description...")).toHaveLength(2);
    });

    it("should handle very large prices", () => {
      const items = [{ description: "Expensive", price: 999999.99 }];

      const { getByText } = render(
        <ServiceItemsInput {...defaultProps} items={items} />,
      );

      expect(getByText("RM999999.99")).toBeTruthy();
    });
  });

  describe("Column Headers", () => {
    it("should display Description and Price headers", () => {
      const { getByText } = render(<ServiceItemsInput {...defaultProps} />);

      expect(getByText("Description")).toBeTruthy();
      expect(getByText("Price")).toBeTruthy();
    });
  });
});
