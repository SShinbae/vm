import { FuelLogService } from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { FuelLogFormData } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const MOCK_FUEL_PRICES = [1.99, 2.6, 3.2]; // RON95, RON97, Diesel?

export const useAddFuelLog = () => {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);

  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: vehicleId || "",
    liters_filled: 0,
    cost: 0,
    fuel_price: MOCK_FUEL_PRICES[0], // Default to first price
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 0,
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- Data Fetching ---
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await VehicleService.getVehiclesSeparated();
      if (!error && data) {
        const allVehicles = [...data.ownVehicles, ...data.sharedVehicles];
        setVehicles(allVehicles);

        // Set default vehicle if not passed in params
        if (!vehicleId && allVehicles.length > 0) {
          setFormData((prev) => ({ ...prev, vehicle_id: allVehicles[0].id }));
        }
      }
      setVehiclesLoading(false);
    };

    fetchVehicles();
  }, [vehicleId]);

  // --- Form Logic & Calculations ---
  const calculateLiters = (cost: number, fuelPrice: number) => {
    if (fuelPrice > 0 && cost > 0) {
      return Math.round((cost / fuelPrice) * 1000) / 1000;
    }
    return 0;
  };

  const handleCostChange = (text: string) => {
    const cost = parseFloat(text) || 0;
    setFormData((prev) => ({
      ...prev,
      cost,
      liters_filled: calculateLiters(cost, prev.fuel_price),
    }));
  };

  const handlePriceChange = (price: number) => {
    setFormData((prev) => ({
      ...prev,
      fuel_price: price,
      liters_filled: calculateLiters(prev.cost, price),
    }));
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
    if (!isFormValid) {
      setErrorMessage("Please fill in all required fields");
      setShowErrorModal(true);
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
      setErrorMessage(error);
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  // --- Modal Handlers ---
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)/logs");
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  return {
    // State
    formData,
    vehicles,
    vehiclesLoading,
    loading,
    isWeb: Platform.OS === "web",
    isLocked: !!vehicleId,
    selectedVehicle: vehicles.find((v) => v.id === formData.vehicle_id),
    fuelPrices: MOCK_FUEL_PRICES,

    // Modals
    showSuccessModal,
    showErrorModal,
    errorMessage,

    // Handlers
    handleCostChange,
    handlePriceChange,
    handleOdometerChange,
    handleDateChange,
    handleLocationChange,
    handleVehicleChange,
    handleSave,
    handleSuccessModalClose,
    handleErrorModalClose,

    // Validation
    validateCost,
    validateOdometer,
    isFormValid,
  };
};
