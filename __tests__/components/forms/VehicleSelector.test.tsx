/**
 * VehicleSelector Component Tests
 *
 * Tests for the vehicle selector component covering
 * selectable state, locked state, and selection callbacks.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";

import { VehicleSelector } from "@/components/forms/VehicleSelector";

// Mock dependencies - theme must be defined inside the mock factory
jest.mock("react-native-unistyles", () => {
  const theme = {
    colors: {
      primary: "#007AFF",
      textSecondary: "#666",
      background: "#fff",
      text: "#000",
      border: "#ccc",
      backgroundSecondary: "#f5f5f5",
      success: "#4CAF50",
      error: "#f44336",
      warning: "#ff9800",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
    },
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  };

  return {
    createStyleSheet: (fn: (t: typeof theme) => object) => fn(theme),
    useStyles: () => ({
      styles: {
        inputContainer: {},
        label: {},
        requiredLabel: {},
        lockedVehicleContainer: {},
        lockedVehicle: {},
        vehicleIcon: {},
        vehicleIconPlaceholder: {},
        lockedVehicleInfo: {},
        lockedVehicleText: {},
        lockedVehiclePlate: {},
        lockIcon: {},
        lockedHelpText: {},
        vehicleSelectorContent: {},
      },
      theme,
    }),
  };
});

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name }: { name: string }) => {
    const RN = jest.requireActual("react-native");
    return <RN.Text testID={`icon-${name}`}>Icon: {name}</RN.Text>;
  },
}));

jest.mock("../../../components/forms/VehicleOption", () => ({
  VehicleOption: ({
    vehicle,
    isSelected,
    onPress,
  }: {
    vehicle: { id: string; make: string; model: string };
    isSelected: boolean;
    onPress: () => void;
  }) => {
    return (
      <TouchableOpacity
        testID={`vehicle-option-${vehicle.id}`}
        onPress={onPress}
        accessibilityState={{ selected: isSelected }}
      >
        <Text>
          {vehicle.make} {vehicle.model}
        </Text>
        {isSelected && <Text testID="selected-indicator">Selected</Text>}
      </TouchableOpacity>
    );
  },
}));

describe("VehicleSelector", () => {
  const mockVehicles = [
    {
      id: "v1",
      user_id: "user-1",
      make: "Toyota",
      model: "Camry",
      year: 2022,
      license_plate: "ABC123",
      vin: null,
      main_image_url: null,
      color: null,
      current_mileage: 50000,
      shared_with_groups: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_own_vehicle: true,
      images: [] as any[],
      shared_groups: [] as any[],
    },
    {
      id: "v2",
      user_id: "user-2",
      make: "Honda",
      model: "Civic",
      year: 2021,
      license_plate: "XYZ789",
      vin: null,
      main_image_url: "https://example.com/car.jpg",
      color: null,
      current_mileage: 30000,
      shared_with_groups: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_own_vehicle: false,
      images: [] as any[],
      shared_groups: [] as any[],
    },
  ];

  const defaultProps = {
    vehicles: mockVehicles,
    selectedVehicleId: "v1",
    onSelectVehicle: jest.fn(),
    isLocked: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Selectable State", () => {
    it("should render all vehicles when not locked", () => {
      const { getByTestId } = render(<VehicleSelector {...defaultProps} />);

      expect(getByTestId("vehicle-option-v1")).toBeTruthy();
      expect(getByTestId("vehicle-option-v2")).toBeTruthy();
    });

    it("should highlight selected vehicle", () => {
      const { getByTestId } = render(<VehicleSelector {...defaultProps} />);

      const selectedOption = getByTestId("vehicle-option-v1");
      expect(selectedOption.props.accessibilityState.selected).toBe(true);
    });

    it("should call onSelectVehicle when vehicle is pressed", () => {
      const onSelectVehicle = jest.fn();
      const { getByTestId } = render(
        <VehicleSelector {...defaultProps} onSelectVehicle={onSelectVehicle} />,
      );

      fireEvent.press(getByTestId("vehicle-option-v2"));

      expect(onSelectVehicle).toHaveBeenCalledWith("v2");
    });

    it("should show label with required indicator", () => {
      const { getByText } = render(<VehicleSelector {...defaultProps} />);

      // The label contains "Vehicle " with a space before the nested "*" text
      expect(getByText(/Vehicle/)).toBeTruthy();
      expect(getByText("*")).toBeTruthy();
    });
  });

  describe("Locked State", () => {
    it("should display only selected vehicle when locked", () => {
      const { getByText, queryByTestId } = render(
        <VehicleSelector {...defaultProps} isLocked={true} />,
      );

      // Should show locked vehicle info
      expect(getByText(/2022 Toyota Camry/)).toBeTruthy();
      expect(getByText("ABC123")).toBeTruthy();

      // Should not show other vehicle options
      expect(queryByTestId("vehicle-option-v2")).toBeNull();
    });

    it("should show lock icon when locked", () => {
      const { getByText } = render(
        <VehicleSelector {...defaultProps} isLocked={true} />,
      );

      // The mock returns "Icon: lock.fill" for the lock icon
      expect(getByText("Icon: lock.fill")).toBeTruthy();
    });

    it("should show help text when locked", () => {
      const { getByText } = render(
        <VehicleSelector {...defaultProps} isLocked={true} />,
      );

      expect(getByText("Adding fuel log for this vehicle")).toBeTruthy();
    });

    it("should not render locked state if selected vehicle not found", () => {
      const { queryByText } = render(
        <VehicleSelector
          {...defaultProps}
          isLocked={true}
          selectedVehicleId="nonexistent"
        />,
      );

      // Should fall back to selectable state since vehicle not found
      expect(queryByText("Adding fuel log for this vehicle")).toBeNull();
    });
  });

  describe("Vehicle Display", () => {
    it("should display vehicle make and model", () => {
      const { getByText } = render(<VehicleSelector {...defaultProps} />);

      expect(getByText(/Toyota Camry/)).toBeTruthy();
      expect(getByText(/Honda Civic/)).toBeTruthy();
    });

    it("should show placeholder icon when no image available", () => {
      const { getByText } = render(
        <VehicleSelector {...defaultProps} isLocked={true} />,
      );

      // First vehicle has no image, should show car icon
      expect(getByText("Icon: car.fill")).toBeTruthy();
    });
  });

  describe("Empty States", () => {
    it("should handle empty vehicles array", () => {
      const { queryByTestId } = render(
        <VehicleSelector {...defaultProps} vehicles={[]} />,
      );

      expect(queryByTestId("vehicle-option-v1")).toBeNull();
    });

    it("should handle single vehicle", () => {
      const { getByTestId, queryByTestId } = render(
        <VehicleSelector {...defaultProps} vehicles={[mockVehicles[0]]} />,
      );

      expect(getByTestId("vehicle-option-v1")).toBeTruthy();
      expect(queryByTestId("vehicle-option-v2")).toBeNull();
    });
  });

  describe("Selection Updates", () => {
    it("should update selection when different vehicle selected", () => {
      const onSelectVehicle = jest.fn();
      const { getByTestId, rerender } = render(
        <VehicleSelector
          {...defaultProps}
          selectedVehicleId="v1"
          onSelectVehicle={onSelectVehicle}
        />,
      );

      // Select second vehicle
      fireEvent.press(getByTestId("vehicle-option-v2"));
      expect(onSelectVehicle).toHaveBeenCalledWith("v2");

      // Rerender with new selection
      rerender(
        <VehicleSelector
          {...defaultProps}
          selectedVehicleId="v2"
          onSelectVehicle={onSelectVehicle}
        />,
      );

      // Second vehicle should now be selected
      const selectedOption = getByTestId("vehicle-option-v2");
      expect(selectedOption.props.accessibilityState.selected).toBe(true);
    });
  });
});
