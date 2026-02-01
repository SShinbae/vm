/**
 * Fuel Log Creation Flow Integration Test
 *
 * Tests the complete fuel log creation flow:
 * Vehicle selection → Form fill → Validation → Submit → Success
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { FuelLogService } from "@/lib/services/loggingService";

// Mock all dependencies
jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock("@/lib/services/loggingService", () => ({
  FuelLogService: {
    createFuelLog: jest.fn(),
    getFuelLogs: jest.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: {
    getVehicles: jest.fn().mockResolvedValue({
      data: [
        {
          id: "v1",
          make: "Toyota",
          model: "Camry",
          year: 2022,
          license_plate: "ABC123",
          current_mileage: 50000,
          is_own_vehicle: true,
        },
      ],
      error: null,
    }),
    getVehiclesSeparated: jest.fn().mockResolvedValue({
      data: {
        ownVehicles: [
          {
            id: "v1",
            make: "Toyota",
            model: "Camry",
            year: 2022,
            license_plate: "ABC123",
            current_mileage: 50000,
            is_own_vehicle: true,
          },
        ],
        sharedVehicles: [],
      },
      error: null,
    }),
  },
}));

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showConfirm: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (fn: any) => fn({ colors: {} }),
  useStyles: () => ({
    styles: {},
    theme: { colors: { primary: "#007AFF" } },
  }),
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("react-native-ui-datepicker", () => ({
  __esModule: true,
  default: () => null,
}));

// Simple test component that simulates the fuel log creation flow
const FuelLogCreationFlow = () => {
  const [step, setStep] = React.useState(1);
  const [vehicleId, setVehicleId] = React.useState("");
  const [formData, setFormData] = React.useState({
    liters_filled: "",
    cost: "",
    odometer_reading: "",
    date: "",
    location: "",
  });
  const [error, setError] = React.useState("");

  const handleVehicleSelect = (id: string) => {
    setVehicleId(id);
    setStep(2);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!vehicleId) return "Vehicle is required";
    if (!formData.liters_filled || parseFloat(formData.liters_filled) <= 0)
      return "Liters filled must be positive";
    if (!formData.cost || parseFloat(formData.cost) <= 0)
      return "Cost must be positive";
    if (!formData.odometer_reading || parseInt(formData.odometer_reading) <= 0)
      return "Odometer reading is required";
    if (!formData.date) return "Date is required";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const result = await FuelLogService.createFuelLog({
        vehicle_id: vehicleId,
        liters_filled: parseFloat(formData.liters_filled),
        cost: parseFloat(formData.cost),
        odometer_reading: parseInt(formData.odometer_reading),
        date: formData.date,
        location: formData.location,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setStep(3);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create fuel log";
      setError(errorMessage);
    }
  };

  return (
    <View testID="fuel-log-creation-flow">
      {step === 1 && (
        <View testID="step-vehicle-selection">
          <Text>Select Vehicle</Text>
          <TouchableOpacity
            testID="vehicle-option-v1"
            onPress={() => handleVehicleSelect("v1")}
          >
            <Text>Toyota Camry</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View testID="step-form-fill">
          <Text>Fill Details</Text>
          <TextInput
            testID="input-liters"
            placeholder="Liters"
            value={formData.liters_filled}
            onChangeText={(v: string) => handleInputChange("liters_filled", v)}
          />
          <TextInput
            testID="input-cost"
            placeholder="Cost"
            value={formData.cost}
            onChangeText={(v: string) => handleInputChange("cost", v)}
          />
          <TextInput
            testID="input-odometer"
            placeholder="Odometer"
            value={formData.odometer_reading}
            onChangeText={(v: string) =>
              handleInputChange("odometer_reading", v)
            }
          />
          <TextInput
            testID="input-date"
            placeholder="Date"
            value={formData.date}
            onChangeText={(v: string) => handleInputChange("date", v)}
          />
          <TextInput
            testID="input-location"
            placeholder="Location"
            value={formData.location}
            onChangeText={(v: string) => handleInputChange("location", v)}
          />
          <TouchableOpacity testID="submit-button" onPress={handleSubmit}>
            <Text>Save</Text>
          </TouchableOpacity>
          {error && <Text testID="error-message">{error}</Text>}
        </View>
      )}

      {step === 3 && (
        <View testID="step-success">
          <Text testID="success-message">Fuel log created successfully!</Text>
        </View>
      )}
    </View>
  );
};

describe("Fuel Log Creation Flow", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (FuelLogService.createFuelLog as jest.Mock).mockResolvedValue({
      data: { id: "new-fuel-log-id" },
      error: null,
    });
  });

  describe("Complete Flow", () => {
    it("should complete full flow: vehicle selection → form fill → submit → success", async () => {
      const { getByTestId } = render(<FuelLogCreationFlow />, {
        wrapper,
      });

      // Step 1: Vehicle Selection
      expect(getByTestId("step-vehicle-selection")).toBeTruthy();
      fireEvent.press(getByTestId("vehicle-option-v1"));

      // Step 2: Form Fill
      await waitFor(() => {
        expect(getByTestId("step-form-fill")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("input-liters"), "45.5");
      fireEvent.changeText(getByTestId("input-cost"), "95.00");
      fireEvent.changeText(getByTestId("input-odometer"), "51000");
      fireEvent.changeText(getByTestId("input-date"), "2024-06-15");
      fireEvent.changeText(getByTestId("input-location"), "Shell Station");

      // Submit
      await act(async () => {
        fireEvent.press(getByTestId("submit-button"));
      });

      // Step 3: Success
      await waitFor(() => {
        expect(getByTestId("success-message")).toBeTruthy();
      });

      expect(FuelLogService.createFuelLog).toHaveBeenCalledWith({
        vehicle_id: "v1",
        liters_filled: 45.5,
        cost: 95,
        odometer_reading: 51000,
        date: "2024-06-15",
        location: "Shell Station",
      });
    });
  });

  describe("Validation", () => {
    it("should show error when liters not filled", async () => {
      const { getByTestId } = render(<FuelLogCreationFlow />, { wrapper });

      // Select vehicle
      fireEvent.press(getByTestId("vehicle-option-v1"));

      await waitFor(() => {
        expect(getByTestId("step-form-fill")).toBeTruthy();
      });

      // Fill partial form (missing liters)
      fireEvent.changeText(getByTestId("input-cost"), "95.00");
      fireEvent.changeText(getByTestId("input-odometer"), "51000");
      fireEvent.changeText(getByTestId("input-date"), "2024-06-15");

      // Submit
      await act(async () => {
        fireEvent.press(getByTestId("submit-button"));
      });

      await waitFor(() => {
        expect(getByTestId("error-message")).toBeTruthy();
      });
    });

    it("should show error when cost not filled", async () => {
      const { getByTestId } = render(<FuelLogCreationFlow />, { wrapper });

      fireEvent.press(getByTestId("vehicle-option-v1"));

      await waitFor(() => {
        expect(getByTestId("step-form-fill")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("input-liters"), "45.5");
      fireEvent.changeText(getByTestId("input-odometer"), "51000");
      fireEvent.changeText(getByTestId("input-date"), "2024-06-15");

      await act(async () => {
        fireEvent.press(getByTestId("submit-button"));
      });

      await waitFor(() => {
        expect(getByTestId("error-message").props.children).toContain("Cost");
      });
    });

    it("should show error when date not filled", async () => {
      const { getByTestId } = render(<FuelLogCreationFlow />, { wrapper });

      fireEvent.press(getByTestId("vehicle-option-v1"));

      await waitFor(() => {
        expect(getByTestId("step-form-fill")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("input-liters"), "45.5");
      fireEvent.changeText(getByTestId("input-cost"), "95.00");
      fireEvent.changeText(getByTestId("input-odometer"), "51000");

      await act(async () => {
        fireEvent.press(getByTestId("submit-button"));
      });

      await waitFor(() => {
        expect(getByTestId("error-message").props.children).toContain("Date");
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error when API call fails", async () => {
      (FuelLogService.createFuelLog as jest.Mock).mockResolvedValue({
        data: null,
        error: "Failed to create fuel log",
      });

      const { getByTestId } = render(<FuelLogCreationFlow />, { wrapper });

      fireEvent.press(getByTestId("vehicle-option-v1"));

      await waitFor(() => {
        expect(getByTestId("step-form-fill")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("input-liters"), "45.5");
      fireEvent.changeText(getByTestId("input-cost"), "95.00");
      fireEvent.changeText(getByTestId("input-odometer"), "51000");
      fireEvent.changeText(getByTestId("input-date"), "2024-06-15");

      await act(async () => {
        fireEvent.press(getByTestId("submit-button"));
      });

      await waitFor(() => {
        expect(getByTestId("error-message")).toBeTruthy();
      });
    });
  });

  describe("Form State", () => {
    it("should preserve form values during validation errors", async () => {
      const { getByTestId } = render(<FuelLogCreationFlow />, { wrapper });

      fireEvent.press(getByTestId("vehicle-option-v1"));

      await waitFor(() => {
        expect(getByTestId("step-form-fill")).toBeTruthy();
      });

      // Fill some fields
      fireEvent.changeText(getByTestId("input-liters"), "45.5");
      fireEvent.changeText(getByTestId("input-cost"), "95.00");

      // Submit with missing fields
      await act(async () => {
        fireEvent.press(getByTestId("submit-button"));
      });

      // Values should be preserved
      expect(getByTestId("input-liters").props.value).toBe("45.5");
      expect(getByTestId("input-cost").props.value).toBe("95.00");
    });
  });
});
