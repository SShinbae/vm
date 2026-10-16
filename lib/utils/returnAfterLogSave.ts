import { router } from "expo-router";

export function returnAfterLogSave(vehicleId?: string, returnTo?: string) {
  if (returnTo === "logs") {
    router.dismissTo("/(tabs)/logs");
  } else if (returnTo === "vehicles") {
    router.dismissTo("/(tabs)/vehicles");
  } else if (vehicleId) {
    router.dismissTo({ pathname: "/vehicles/[id]", params: { id: vehicleId } });
  } else {
    router.dismissTo("/(tabs)/logs");
  }
}
