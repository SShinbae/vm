import { supabase } from "../../services/supabaseClient";

/**
 * Formats service items from JSON string to numbered list
 * @param description - JSON string containing array of service items
 * @returns Formatted string with numbered list of service items
 */
export const formatServiceItems = (description: string): string => {
  try {
    // Try to parse the description as JSON array
    const items = JSON.parse(description);
    if (Array.isArray(items)) {
      return items
        .map(
          (item, index) => `${index + 1}) ${item.description} RM${item.price}`,
        )
        .join("\n");
    }
     
  } catch (error) {
    // If parsing fails, return the original description
  }
  return description;
};

/**
 * Standardized function to check if a user can access/modify a vehicle
 * This should be used consistently across all services and UI components
 */
export const canUserAccessVehicle = async (
  vehicleId: string,
  userId: string,
): Promise<boolean> => {
  try {
    // First, check if user owns the vehicle
    const { data: ownedVehicles, error: ownedError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("user_id", userId);

    if (!ownedError && ownedVehicles && ownedVehicles.length > 0) {
      return true; // User owns the vehicle
    }

    // If not owned, check if vehicle is shared with user through groups
    const { data: userGroups, error: groupError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (groupError || !userGroups || userGroups.length === 0) {
      return false; // No groups to check
    }

    const groupIds = (userGroups as { group_id: string }[]).map((g) => g.group_id);

    // Check if vehicle is shared with any of these groups
    const { data: sharedVehicles, error: shareError } = await supabase
      .from("vehicle_group_shares")
      .select("vehicle_id")
      .eq("vehicle_id", vehicleId)
      .in("group_id", groupIds);

    return !shareError && sharedVehicles && sharedVehicles.length > 0;
  } catch (error) {
    console.error("Error checking vehicle access:", error);
    return false;
  }
};
