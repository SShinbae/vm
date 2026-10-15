import { router } from "expo-router";

export function returnAfterLogSave(vehicleId?: string, returnTo?: string) {
  if (returnTo === "vehicles") {
    router.dismissTo("/(tabs)/vehicles");
  } else if (vehicleId) {
    router.dismissTo({ pathname: "/vehicles/[id]", params: { id: vehicleId } });
  } else {
    router.dismissTo("/(tabs)/logs");
  }
}
