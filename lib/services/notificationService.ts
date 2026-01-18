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
  private userEmail: string | null = null;
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

  // Track previous subscription state for smart recreation
  private lastSubscriptionState: {
    vehicleIds: string[];
    groupIds: string[];
    email: string | null;
  } = {
    vehicleIds: [],
    groupIds: [],
    email: null,
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
    const [userGroupsResult, vehiclesResult, profileResult] = await Promise.all(
      [
        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", this.userId),
        supabase.from("vehicles").select("id").eq("user_id", this.userId),
        supabase
          .from("profiles")
          .select("email")
          .eq("id", this.userId)
          .single(),
      ],
    );

    this.userGroupIds =
      (userGroupsResult.data as { group_id: string }[] | null)?.map(
        (g) => g.group_id,
      ) || [];

    this.userVehicleIds =
      (vehiclesResult.data as { id: string }[] | null)?.map((v) => v.id) || [];

    this.userEmail =
      (profileResult.data as { email: string } | null)?.email || null;

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
    console.log("✅ User data loaded and cached", {
      vehicleCount: this.userVehicleIds.length,
      groupCount: this.userGroupIds.length,
      email: this.userEmail ? "set" : "not set",
    });
  }

  private setupRealtimeSubscriptions(): void {
    // Store current state for future comparison
    this.lastSubscriptionState = {
      vehicleIds: [...this.userVehicleIds],
      groupIds: [...this.userGroupIds],
      email: this.userEmail,
    };

    this.subscribeToLogChanges();
    this.subscribeToGroupChanges();
    this.subscribeToInvitations();

    console.log("📡 Realtime subscriptions configured with filters:", {
      vehicleFilter:
        this.userVehicleIds.length > 0
          ? `vehicle_id in (${this.userVehicleIds.length} vehicles)`
          : "none (no vehicles)",
      groupFilter:
        this.userGroupIds.length > 0
          ? `group_id in (${this.userGroupIds.length} groups)`
          : "none (no groups)",
      emailFilter: this.userEmail ? `email = ${this.userEmail}` : "none",
    });
  }

  private subscribeToLogChanges(): void {
    // OPTIMIZATION: Only subscribe if user has vehicles to monitor
    // This prevents unnecessary data transfer for users with no vehicles
    if (this.userVehicleIds.length === 0) {
      console.log(
        "⏭️ Skipping log subscriptions - user has no vehicles to monitor",
      );
      return;
    }

    // Build server-side filter for vehicle IDs
    // This dramatically reduces data transfer by filtering at the database level
    const vehicleFilter = `vehicle_id=in.(${this.userVehicleIds.join(",")})`;

    // Subscribe to mileage logs with server-side filter
    const mileageChannel = supabase
      .channel(`mileage-logs-${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mileage_logs",
          filter: vehicleFilter,
        },
        async (payload) => {
          await this.handleLogChange("mileage_log", payload);
        },
      )
      .subscribe();

    // Subscribe to fuel logs with server-side filter
    const fuelChannel = supabase
      .channel(`fuel-logs-${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fuel_logs",
          filter: vehicleFilter,
        },
        async (payload) => {
          await this.handleLogChange("fuel_log", payload);
        },
      )
      .subscribe();

    // Subscribe to service logs with server-side filter
    const serviceChannel = supabase
      .channel(`service-logs-${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_logs",
          filter: vehicleFilter,
        },
        async (payload) => {
          await this.handleLogChange("service_log", payload);
        },
      )
      .subscribe();

    this.channels.push(mileageChannel, fuelChannel, serviceChannel);
  }

  private subscribeToGroupChanges(): void {
    // OPTIMIZATION: Only subscribe if user is a member of any groups
    // This prevents unnecessary data transfer for users not in any groups
    if (this.userGroupIds.length === 0) {
      console.log(
        "⏭️ Skipping group_members subscription - user has no groups",
      );
      return;
    }

    // Build server-side filter for group IDs
    const groupFilter = `group_id=in.(${this.userGroupIds.join(",")})`;

    // Subscribe to group member changes with server-side filter
    const groupMemberChannel = supabase
      .channel(`group-members-${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: groupFilter,
        },
        async (payload) => {
          await this.handleGroupMemberChange(payload);
        },
      )
      .subscribe();

    this.channels.push(groupMemberChannel);
  }

  private subscribeToInvitations(): void {
    // OPTIMIZATION: Only subscribe if we have the user's email
    if (!this.userEmail) {
      console.log(
        "⏭️ Skipping group_invitations subscription - user email not available",
      );
      return;
    }

    console.log("🔌 Subscribing to group_invitations table changes...");

    // Build server-side filter for user's email (case-insensitive comparison done server-side)
    // Note: This assumes emails are stored in lowercase in the database
    const emailFilter = `email=eq.${this.userEmail.toLowerCase()}`;

    // Subscribe to group invitations with server-side filter
    const invitationChannel = supabase
      .channel(`group-invitations-${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Only care about new invitations
          schema: "public",
          table: "group_invitations",
          filter: emailFilter,
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
    console.log("✅ group_invitations subscription created with email filter");
  }

  private async handleLogChange(
    logType: "mileage_log" | "fuel_log" | "service_log",
    payload: any,
  ): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Skip if this is the current user's own action
    // Note: Vehicle relevance is already filtered server-side via the subscription filter
    if (
      newRecord?.user_id === this.userId ||
      oldRecord?.user_id === this.userId
    ) {
      return;
    }

    const vehicleId = newRecord?.vehicle_id || oldRecord?.vehicle_id;

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
    // Note: Group relevance is already filtered server-side via the subscription filter
    if (
      newRecord?.user_id === this.userId ||
      oldRecord?.user_id === this.userId
    ) {
      return;
    }

    const groupId = newRecord?.group_id || oldRecord?.group_id;

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
    // Note: Email relevance and INSERT event are already filtered server-side
    // via the subscription filter, so we don't need client-side checks
    const { new: newRecord } = payload;

    console.log("🔔 Processing group invitation for user", {
      invitationId: newRecord.id,
      groupId: newRecord.group_id,
    });

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

    this.notifyCallbacks(notification);
    console.log("✅ Group invitation notification sent");
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
   * Check if subscriptions need to be recreated due to changed user data
   * Returns true if vehicle IDs, group IDs, or email have changed
   */
  private shouldRecreateSubscriptions(): boolean {
    const vehiclesChanged =
      this.userVehicleIds.length !==
        this.lastSubscriptionState.vehicleIds.length ||
      !this.userVehicleIds.every((id) =>
        this.lastSubscriptionState.vehicleIds.includes(id),
      );

    const groupsChanged =
      this.userGroupIds.length !== this.lastSubscriptionState.groupIds.length ||
      !this.userGroupIds.every((id) =>
        this.lastSubscriptionState.groupIds.includes(id),
      );

    const emailChanged = this.userEmail !== this.lastSubscriptionState.email;

    return vehiclesChanged || groupsChanged || emailChanged;
  }

  /**
   * Recreate all realtime subscriptions with updated filters
   * Call this after user data changes (e.g., joining a group, adding a vehicle)
   */
  async recreateSubscriptions(): Promise<void> {
    console.log("🔄 Recreating realtime subscriptions...");

    // First, refresh user data to get latest vehicles/groups
    await this.loadUserData(true);

    // Check if recreation is actually needed
    if (!this.shouldRecreateSubscriptions()) {
      console.log("⏭️ No subscription changes needed - data unchanged");
      return;
    }

    // Cleanup existing channels
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels = [];

    // Setup new subscriptions with updated filters
    this.setupRealtimeSubscriptions();

    console.log("✅ Realtime subscriptions recreated with updated filters");
  }

  /**
   * Invalidate cache - useful when user joins/leaves a group or adds/removes a vehicle
   * Optionally recreates subscriptions if data has changed
   */
  invalidateCache(): void {
    this.userDataCache.timestamp = 0;
    console.log("🗑️ User data cache invalidated");
  }

  /**
   * Invalidate cache and recreate subscriptions
   * Use this when user's vehicles or groups change
   */
  async invalidateAndRecreate(): Promise<void> {
    this.invalidateCache();
    await this.recreateSubscriptions();
  }

  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels = [];
    this.callbacks = [];
    // Reset subscription state
    this.lastSubscriptionState = {
      vehicleIds: [],
      groupIds: [],
      email: null,
    };
  }
}

export const notificationService = new NotificationService();
