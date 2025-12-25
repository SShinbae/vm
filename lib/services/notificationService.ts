import { supabase } from "../../services/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface NotificationData {
  id: string;
  user_id: string;
  notification_type:
    | "mileage_log"
    | "fuel_log"
    | "service_log"
    | "group_member"
    | "group_invite";
  title: string;
  body: string;
  data: any | null;
  read: boolean;
  related_vehicle_id?: string | null;
  related_group_id?: string | null;
  action_url?: string | null;
  created_at: string;
}

export type NotificationCallback = (notification: NotificationData) => void;

class NotificationService {
  private channels: RealtimeChannel[] = [];
  private callbacks: NotificationCallback[] = [];
  private userId: string | null = null;
  private userGroupIds: string[] = [];
  private userVehicleIds: string[] = [];

  // Cache configuration for user data
  private userDataCache: {
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  } = {
    timestamp: 0,
    ttl: 5 * 60 * 1000, // 5 minutes cache
  };

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadUserData();
    this.setupRealtimeSubscriptions();
  }

  private async loadUserData(force: boolean = false): Promise<void> {
    if (!this.userId) return;

    // Check cache validity
    const now = Date.now();
    const isCacheValid =
      now - this.userDataCache.timestamp < this.userDataCache.ttl;

    if (!force && isCacheValid && this.userGroupIds.length > 0) {
      console.log("📦 Using cached user data, skipping database queries");
      return;
    }

    console.log("🔄 Cache expired or forced, fetching fresh user data...");

    // OPTIMIZATION: Run all queries in parallel for better performance
    const [userGroupsResult, vehiclesResult] = await Promise.all([
      supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", this.userId),
      supabase.from("vehicles").select("id").eq("user_id", this.userId),
    ]);

    this.userGroupIds =
      (userGroupsResult.data as { group_id: string }[] | null)?.map(
        (g) => g.group_id,
      ) || [];

    this.userVehicleIds =
      (vehiclesResult.data as { id: string }[] | null)?.map((v) => v.id) || [];

    // Get shared vehicles through groups (only if user has groups)
    if (this.userGroupIds.length > 0) {
      const { data: sharedVehicles } = await supabase
        .from("vehicle_group_shares")
        .select("vehicle_id")
        .in("group_id", this.userGroupIds);

      const sharedVehicleIds =
        (sharedVehicles as { vehicle_id: string }[] | null)?.map(
          (sv) => sv.vehicle_id,
        ) || [];
      this.userVehicleIds = [...this.userVehicleIds, ...sharedVehicleIds];
    }

    // Update cache timestamp
    this.userDataCache.timestamp = now;
    console.log("✅ User data loaded and cached");
  }

  private setupRealtimeSubscriptions(): void {
    this.subscribeToLogChanges();
    this.subscribeToGroupChanges();
    this.subscribeToInvitations();
  }

  private subscribeToLogChanges(): void {
    // Subscribe to mileage logs
    const mileageChannel = supabase
      .channel("mileage-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mileage_logs",
        },
        async (payload) => {
          await this.handleLogChange("mileage_log", payload);
        },
      )
      .subscribe();

    // Subscribe to fuel logs
    const fuelChannel = supabase
      .channel("fuel-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fuel_logs",
        },
        async (payload) => {
          await this.handleLogChange("fuel_log", payload);
        },
      )
      .subscribe();

    // Subscribe to service logs
    const serviceChannel = supabase
      .channel("service-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_logs",
        },
        async (payload) => {
          await this.handleLogChange("service_log", payload);
        },
      )
      .subscribe();

    this.channels.push(mileageChannel, fuelChannel, serviceChannel);
  }

  private subscribeToGroupChanges(): void {
    // Subscribe to group member changes
    const groupMemberChannel = supabase
      .channel("group-members-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
        },
        async (payload) => {
          await this.handleGroupMemberChange(payload);
        },
      )
      .subscribe();

    this.channels.push(groupMemberChannel);
  }

  private subscribeToInvitations(): void {
    console.log("🔌 Subscribing to group_invitations table changes...");
    // Subscribe to group invitations
    const invitationChannel = supabase
      .channel("group-invitations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_invitations",
        },
        async (payload) => {
          console.log(
            "🔔 Realtime event received from group_invitations!",
            payload,
          );
          await this.handleInvitationChange(payload);
        },
      )
      .subscribe((status) => {
        console.log("📡 group_invitations subscription status:", status);
      });

    this.channels.push(invitationChannel);
    console.log("✅ group_invitations subscription created");
  }

  private async handleLogChange(
    logType: "mileage_log" | "fuel_log" | "service_log",
    payload: any,
  ): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Skip if this is the current user's own action
    if (
      newRecord?.user_id === this.userId ||
      oldRecord?.user_id === this.userId
    ) {
      return;
    }

    // Check if the vehicle is relevant to the user
    const vehicleId = newRecord?.vehicle_id || oldRecord?.vehicle_id;
    if (!this.userVehicleIds.includes(vehicleId)) {
      return;
    }

    // Get vehicle and user information
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model, year")
      .eq("id", vehicleId)
      .single();

    const { data: user } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", newRecord?.user_id || oldRecord?.user_id)
      .single();

    const vehicleData = vehicle as {
      make: string;
      model: string;
      year: number;
    } | null;
    const userData = user as { full_name: string | null; email: string } | null;

    const vehicleName = vehicleData
      ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`
      : "Unknown Vehicle";
    const userName = userData?.full_name || userData?.email || "Someone";

    let title = "";
    let message = "";

    switch (eventType) {
      case "INSERT":
        title = `New ${logType.replace("_", " ")} entry`;
        message = `${userName} added a new ${logType.replace("_", " ")} entry for ${vehicleName}`;
        break;
      case "UPDATE":
        title = `${logType.replace("_", " ")} updated`;
        message = `${userName} updated a ${logType.replace("_", " ")} entry for ${vehicleName}`;
        break;
      case "DELETE":
        title = `${logType.replace("_", " ")} deleted`;
        message = `${userName} deleted a ${logType.replace("_", " ")} entry for ${vehicleName}`;
        break;
    }

    const notification: NotificationData = {
      id: `${logType}-${eventType}-${Date.now()}`,
      user_id: this.userId!,
      notification_type: logType,
      title,
      body: message,
      data: {
        action: eventType,
        userName,
        performedBy: newRecord?.user_id || oldRecord?.user_id,
      },
      read: false,
      related_vehicle_id: vehicleId,
      related_group_id: null,
      action_url: null,
      created_at: new Date().toISOString(),
    };

    this.notifyCallbacks(notification);
  }

  private async handleGroupMemberChange(payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Only handle additions and removals, not the current user
    if (
      newRecord?.user_id === this.userId ||
      oldRecord?.user_id === this.userId
    ) {
      return;
    }

    const groupId = newRecord?.group_id || oldRecord?.group_id;
    if (!this.userGroupIds.includes(groupId)) {
      return;
    }

    // Get group and user information
    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .single();

    const { data: user } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", newRecord?.user_id || oldRecord?.user_id)
      .single();

    const groupData = group as { name: string } | null;
    const userData = user as { full_name: string | null; email: string } | null;

    const groupName = groupData?.name || "Unknown Group";
    const userName = userData?.full_name || userData?.email || "Someone";

    let title = "";
    let message = "";

    switch (eventType) {
      case "INSERT":
        title = "New group member";
        message = `${userName} joined ${groupName}`;
        break;
      case "DELETE":
        title = "Member left group";
        message = `${userName} left ${groupName}`;
        break;
    }

    const notification: NotificationData = {
      id: `group-member-${eventType}-${Date.now()}`,
      user_id: this.userId!,
      notification_type: "group_member",
      title,
      body: message,
      data: {
        action: eventType,
        userName,
        performedBy: newRecord?.user_id || oldRecord?.user_id,
      },
      read: false,
      related_vehicle_id: null,
      related_group_id: groupId,
      action_url: null,
      created_at: new Date().toISOString(),
    };

    this.notifyCallbacks(notification);
  }

  private async handleInvitationChange(payload: any): Promise<void> {
    console.log("🔔 handleInvitationChange called", {
      eventType: payload.eventType,
      newRecord: payload.new,
    });

    const { eventType, new: newRecord } = payload;

    if (eventType !== "INSERT") {
      console.log("❌ Event type is not INSERT, skipping");
      return;
    }

    console.log("✅ Event type is INSERT, processing invitation");

    // Get current user's email to check if this invitation is for them
    console.log("🔍 Fetching user profile for userId:", this.userId);

    let userProfile, profileError;
    try {
      const result = await supabase
        .from("profiles")
        .select("email")
        .eq("id", this.userId!)
        .single();
      userProfile = result.data;
      profileError = result.error;
    } catch (error) {
      console.error("💥 Exception while fetching user profile:", error);
      return;
    }

    console.log("👤 Current user profile:", {
      userId: this.userId,
      userProfile,
      profileError,
    });

    const userProfileData = userProfile as { email: string } | null;

    console.log("📧 Email comparison:", {
      invitationEmail: newRecord.email,
      userEmail: userProfileData?.email,
      invitationEmailLower: newRecord.email?.toLowerCase(),
      userEmailLower: userProfileData?.email?.toLowerCase(),
      match:
        newRecord.email?.toLowerCase() ===
        userProfileData?.email?.toLowerCase(),
    });

    if (
      !userProfileData ||
      newRecord.email.toLowerCase() !== userProfileData.email.toLowerCase()
    ) {
      console.log(
        "❌ Email does not match current user, skipping notification",
      );
      return;
    }

    console.log("✅ Email matches! Creating notification...");

    // Get group and inviter information
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("name")
      .eq("id", newRecord.group_id)
      .single();

    if (groupError) {
      console.warn("⚠️ Could not fetch group details:", groupError);
    }

    const { data: inviter, error: inviterError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", newRecord.invited_by)
      .single();

    if (inviterError) {
      console.warn("⚠️ Could not fetch inviter details:", inviterError);
    }

    const groupData = group as { name: string } | null;
    const inviterData = inviter as {
      full_name: string | null;
      email: string;
    } | null;

    const groupName = groupData?.name || "Unknown Group";
    const inviterName =
      inviterData?.full_name || inviterData?.email || "Someone";

    const notification: NotificationData = {
      id: `invite-${newRecord.id}`,
      user_id: this.userId!,
      notification_type: "group_invite",
      title: "Group invitation",
      body: `${inviterName} invited you to join ${groupName}`,
      data: {
        action: "INSERT",
        userName: inviterName,
        performedBy: newRecord.invited_by,
        invitationId: newRecord.id,
      },
      read: false,
      related_vehicle_id: null,
      related_group_id: newRecord.group_id,
      action_url: null,
      created_at: new Date().toISOString(),
    };

    console.log("📝 Notification object created:", notification);
    console.log("🔔 Number of callbacks registered:", this.callbacks.length);

    this.notifyCallbacks(notification);

    console.log("✅ notifyCallbacks called");
  }

  private notifyCallbacks(notification: NotificationData): void {
    console.log("🔔 notifyCallbacks triggered with", {
      notification,
      callbackCount: this.callbacks.length,
    });
    this.callbacks.forEach((callback, index) => {
      console.log(
        `🔔 Executing callback ${index + 1}/${this.callbacks.length}`,
      );
      callback(notification);
    });
  }

  addCallback(callback: NotificationCallback): void {
    this.callbacks.push(callback);
  }

  removeCallback(callback: NotificationCallback): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  async refreshUserData(force: boolean = false): Promise<void> {
    await this.loadUserData(force);
  }

  /**
   * Invalidate cache - useful when user joins/leaves a group or adds/removes a vehicle
   */
  invalidateCache(): void {
    this.userDataCache.timestamp = 0;
    console.log("🗑️ User data cache invalidated");
  }

  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels = [];
    this.callbacks = [];
  }
}

export const notificationService = new NotificationService();
