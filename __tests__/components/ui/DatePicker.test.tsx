/**
 * DatePicker Component Tests
 *
 * Tests for the date picker component covering
 * date format parsing, display formatting, and callbacks.
 */

import React from "react";
import { StyleSheet } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

import { DatePicker } from "@/components/ui/DatePicker";

// Mock dependencies
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text testID={testID || `icon-${name}`}>{name}</Text>;
  },
}));

jest.mock("react-native-ui-datepicker", () => {
  const { View, Text, TouchableOpacity } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({
      onChange,
      date,
    }: {
      onChange: (params: { date: Date }) => void;
      date: Date;
    }) => {
      return (
        <View testID="date-time-picker">
          <Text>Current: {date?.toString()}</Text>
          <TouchableOpacity
            testID="select-date-button"
            onPress={() => onChange({ date: new Date("2024-06-15T12:00:00") })}
          >
            <Text>Select June 15</Text>
          </TouchableOpacity>
        </View>
      );
    },
  };
});

describe("DatePicker", () => {
  const defaultProps = {
    label: "Date",
    value: "",
    onDateChange: jest.fn(),
    placeholder: "Select date",
    required: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes a labelled date control with a 48-point minimum target", () => {
    const { getByRole } = render(<DatePicker {...defaultProps} />);
    const trigger = getByRole("button", { name: "Date" });
    expect(
      StyleSheet.flatten(trigger.props.style).minHeight,
    ).toBeGreaterThanOrEqual(48);
  });

  describe("Rendering", () => {
    it("should render label", () => {
      const { getByText } = render(<DatePicker {...defaultProps} />);

      expect(getByText("Date")).toBeTruthy();
    });

    it("should show required indicator when required", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} required={true} />,
      );

      expect(getByText("*")).toBeTruthy();
    });

    it("should not show required indicator when not required", () => {
      const { queryByText } = render(
        <DatePicker {...defaultProps} required={false} />,
      );

      expect(queryByText("*")).toBeNull();
    });

    it("should show placeholder when no value", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} placeholder="Choose a date" />,
      );

      expect(getByText("Choose a date")).toBeTruthy();
    });

    it("should show calendar icon", () => {
      const { getByTestId } = render(<DatePicker {...defaultProps} />);

      expect(getByTestId("icon-calendar")).toBeTruthy();
    });
  });

  describe("Date Format Parsing", () => {
    it("should parse DD/MM/YYYY format", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="15/06/2024" />,
      );

      // Should display formatted date
      expect(getByText("15/06/2024")).toBeTruthy();
    });

    it("should parse YYYY-MM-DD format (database format)", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-06-15" />,
      );

      // Should display in DD/MM/YYYY format
      expect(getByText("15/06/2024")).toBeTruthy();
    });

    it("should handle empty value", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="" placeholder="Select date" />,
      );

      expect(getByText("Select date")).toBeTruthy();
    });
  });

  describe("Date Selection", () => {
    it("should open picker when date button pressed", () => {
      const { getByTestId, queryByTestId } = render(
        <DatePicker {...defaultProps} />,
      );

      // Initially, picker should not be visible
      expect(queryByTestId("date-time-picker")).toBeNull();

      // Press the date button (which shows placeholder or current value)
      fireEvent.press(getByTestId("icon-calendar").parent!);

      expect(getByTestId("date-time-picker")).toBeTruthy();
    });

    it("should call onDateChange with YYYY-MM-DD format", () => {
      const onDateChange = jest.fn();
      const { getByTestId, getByText } = render(
        <DatePicker {...defaultProps} onDateChange={onDateChange} />,
      );

      // Open picker by pressing the button
      fireEvent.press(getByText(defaultProps.placeholder));

      // Select a date from the mocked picker, then confirm it
      fireEvent.press(getByTestId("select-date-button"));
      expect(onDateChange).not.toHaveBeenCalled();
      fireEvent.press(getByText("Confirm"));

      expect(onDateChange).toHaveBeenCalledTimes(1);
      expect(onDateChange).toHaveBeenCalledWith("2024-06-15");
    });
  });

  describe("Display Formatting", () => {
    it("should display date in DD/MM/YYYY format", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-01-15" />,
      );

      expect(getByText("15/01/2024")).toBeTruthy();
    });

    it("should pad single digit day and month", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-01-05" />,
      );

      expect(getByText("05/01/2024")).toBeTruthy();
    });

    it("should show full year", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-12-25" />,
      );

      expect(getByText("25/12/2024")).toBeTruthy();
    });
  });

  describe("Modal Behavior", () => {
    it("should close modal after date selection", () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <DatePicker {...defaultProps} />,
      );

      // Open picker
      fireEvent.press(getByText(defaultProps.placeholder));
      expect(getByTestId("date-time-picker")).toBeTruthy();

      // Select date and confirm
      fireEvent.press(getByTestId("select-date-button"));
      fireEvent.press(getByText("Confirm"));

      // Modal should be closed (picker should not be visible)
      expect(queryByTestId("date-time-picker")).toBeNull();
    });
  });

  describe("Styles", () => {
    it("should apply custom style prop", () => {
      const customStyle = { marginBottom: 20 };
      const { getByText } = render(
        <DatePicker {...defaultProps} style={customStyle} />,
      );

      // Component should render without errors
      expect(getByText("Date")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date gracefully", () => {
      // An unparseable value falls back to the placeholder.
      const { getByText, queryByText } = render(
        <DatePicker {...defaultProps} value="invalid-date" />,
      );

      expect(queryByText("Invalid Date")).toBeNull();
      expect(getByText(defaultProps.placeholder)).toBeTruthy();
    });

    it("should handle leap year date", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-02-29" />,
      );

      expect(getByText("29/02/2024")).toBeTruthy();
    });

    it("should handle end of year date", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-12-31" />,
      );

      expect(getByText("31/12/2024")).toBeTruthy();
    });

    it("should handle beginning of year date", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} value="2024-01-01" />,
      );

      expect(getByText("01/01/2024")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible label", () => {
      const { getByText } = render(
        <DatePicker {...defaultProps} label="Select Birth Date" />,
      );

      expect(getByText("Select Birth Date")).toBeTruthy();
    });
  });
});
