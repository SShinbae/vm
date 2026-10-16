import { returnAfterLogSave } from "@/lib/utils/returnAfterLogSave";
import { FuelLogService } from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { FuelLogFormData } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { FALLBACK_FUEL_PRICES, useFuelPrices } from "./useFuelPrices";
import { useToast } from "./useToast";

export const useAddFuelLog = () => {
  const { vehicleId, returnTo } = useLocalSearchParams<{
    vehicleId?: string;
    returnTo?: string;
  }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const { showSuccess, showError } = useToast();
  const posthog = usePostHog();
  const fuelPrices = useFuelPrices();
  const priceTouched = useRef(false);

  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: vehicleId || "",
    liters_filled: 0,
    cost: 0,
    fuel_price: FALLBACK_FUEL_PRICES[0].price, // Default to first price
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 0,
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [vehiclesAttempt, setVehiclesAttempt] = useState(0);
  const retryVehicles = () => setVehiclesAttempt((value) => value + 1);

  const [lastEditedField, setLastEditedField] = useState<
    "cost" | "liters" | null
  >(null);

  // Raw string inputs to preserve decimals while typing
  const [costInput, setCostInput] = useState("");
  const [litersInput, setLitersInput] = useState("");

  // --- Data Fetching ---
  useEffect(() => {
    let active = true;
    setVehiclesLoading(true);
    setVehiclesError(null);
    const fetchVehicles = async () => {
      try {
        const { data, error } = await VehicleService.getVehiclesSeparated();
        if (!active) return;
        if (error || !data) throw new Error(error || "Failed to load vehicles");
        const allVehicles = [...data.ownVehicles, ...data.sharedVehicles];
        setVehicles(allVehicles);
        if (
          vehicleId &&
          !allVehicles.some((vehicle) => vehicle.id === vehicleId)
        ) {
          setFormData((prev) => ({ ...prev, vehicle_id: "" }));
          throw new Error(
            "This vehicle is unavailable or you no longer have access.",
          );
        }
        setFormData((prev) => ({
          ...prev,
          vehicle_id:
            vehicleId ||
            (allVehicles.some((vehicle) => vehicle.id === prev.vehicle_id)
              ? prev.vehicle_id
              : allVehicles[0]?.id || ""),
        }));
      } catch (reason) {
        if (active)
          setVehiclesError(
            reason instanceof Error
              ? reason.message
              : "Failed to load vehicles",
          );
      } finally {
        if (active) setVehiclesLoading(false);
      }
    };
    void fetchVehicles();
    return () => {
      active = false;
    };
  }, [vehicleId, vehiclesAttempt]);

  // Once live prices load, default to the first unless the user already chose
  useEffect(() => {
    if (!priceTouched.current && fuelPrices[0]) {
      setFormData((prev) => ({ ...prev, fuel_price: fuelPrices[0].price }));
    }
  }, [fuelPrices]);

  // --- Form Logic & Calculations ---
  const calculateLiters = (cost: number, fuelPrice: number) => {
    if (fuelPrice > 0 && cost > 0) {
      return Math.round((cost / fuelPrice) * 1000) / 1000;
    }
    return 0;
  };

  const calculateCost = (liters: number, fuelPrice: number) => {
    if (fuelPrice > 0 && liters > 0) {
      return Math.round(liters * fuelPrice * 100) / 100;
    }
    return 0;
  };

  const handleCostChange = (text: string) => {
    setCostInput(text); // Store raw input to preserve decimals while typing
    const cost = parseFloat(text) || 0;
    setLastEditedField("cost");
    setFormData((prev) => {
      const liters = calculateLiters(cost, prev.fuel_price);
      // Update liters input display when auto-calculating
      if (cost > 0 && prev.fuel_price > 0) {
        setLitersInput(liters > 0 ? liters.toFixed(3) : "");
      }
      return {
        ...prev,
        cost,
        liters_filled: liters,
      };
    });
  };

  const handleLitersChange = (text: string) => {
    setLitersInput(text); // Store raw input to preserve decimals while typing
    const liters = parseFloat(text) || 0;
    setLastEditedField("liters");
    setFormData((prev) => {
      const cost = calculateCost(liters, prev.fuel_price);
      // Update cost input display when auto-calculating
      if (liters > 0 && prev.fuel_price > 0) {
        setCostInput(cost > 0 ? cost.toFixed(2) : "");
      }
      return {
        ...prev,
        liters_filled: liters,
        cost,
      };
    });
  };

  const handlePriceChange = (price: number) => {
    priceTouched.current = true;
    setFormData((prev) => {
      const newData = { ...prev, fuel_price: price };

      // Recalculate based on which field was last edited
      if (lastEditedField === "liters" && prev.liters_filled > 0) {
        newData.cost = calculateCost(prev.liters_filled, price);
        setCostInput(newData.cost > 0 ? newData.cost.toFixed(2) : "");
      } else if (prev.cost > 0) {
        // Default to recalculating liters from cost
        newData.liters_filled = calculateLiters(prev.cost, price);
        setLitersInput(
          newData.liters_filled > 0 ? newData.liters_filled.toFixed(3) : "",
        );
      }

      return newData;
    });
  };

  const handleOdometerChange = (text: string) => {
    const reading = parseInt(text.replace(/,/g, "")) || 0;
    setFormData((prev) => ({ ...prev, odometer_reading: reading }));
  };

  const handleDateChange = (text: string) => {
    setFormData((prev) => ({ ...prev, date: text }));
  };

  const handleLocationChange = (text: string) => {
    setFormData((prev) => ({ ...prev, location: text }));
  };

  const handleVehicleChange = (id: string) => {
    setFormData((prev) => ({ ...prev, vehicle_id: id }));
  };

  // --- Validation ---
  const validateCost = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return "Please enter a valid cost";
  };

  const validateOdometer = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return "Please enter a valid odometer reading";
  };

  const isFormValid =
    formData.vehicle_id &&
    formData.cost &&
    formData.cost > 0 &&
    formData.fuel_price &&
    formData.fuel_price > 0 &&
    formData.odometer_reading > 0 &&
    formData.date;

  // --- Submission ---
  const handleSave = async () => {
    if (
      vehiclesLoading ||
      vehiclesError ||
      !vehicles.some((vehicle) => vehicle.id === formData.vehicle_id)
    )
      return;
    if (!isFormValid) {
      showError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const { error } = await FuelLogService.createFuelLog({
      ...formData,
      cost: formData.cost || undefined,
      location: formData.location?.trim() || undefined,
    });
    setLoading(false);

    if (error) {
      showError(error);
    } else {
      posthog?.capture("fuel_log_created", {
        cost: formData.cost,
        fuel_price: formData.fuel_price,
        odometer_reading: formData.odometer_reading,
      });
      showSuccess("Fuel log added successfully!");
      returnAfterLogSave(vehicleId, returnTo);
    }
  };

  return {
    // State
    formData,
    vehicles,
    vehiclesLoading,
    vehiclesError,
    retryVehicles,
    loading,
    isWeb: Platform.OS === "web",
    isLocked: !!vehicleId,
    selectedVehicle: vehicles.find((v) => v.id === formData.vehicle_id),
    fuelPrices,

    // Raw input values for display (preserves decimals while typing)
    costInput,
    litersInput,

    // Handlers
    handleCostChange,
    handleLitersChange,
    handlePriceChange,
    handleOdometerChange,
    handleDateChange,
    handleLocationChange,
    handleVehicleChange,
    handleSave,

    // Validation
    validateCost,
    validateOdometer,
    isFormValid,
  };
};
