/**
 * Query key factory for consistent React Query cache management
 *
 * Pattern: Each entity has:
 * - all: Base key for entity
 * - list: Key for list queries (with optional filters)
 * - detail: Key for single entity queries
 *
 * Benefits:
 * - Consistent cache invalidation
 * - Type-safe query keys
 * - Easy to invalidate related queries
 */

export const queryKeys = {
  // ============================================================================
  // Vehicles
  // ============================================================================
  vehicles: {
    all: ["vehicles"] as const,
    lists: () => [...queryKeys.vehicles.all, "list"] as const,
    list: (userId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.vehicles.lists(), userId, filters] as const,
    details: () => [...queryKeys.vehicles.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
    withSharing: (userId: string) =>
      [...queryKeys.vehicles.all, "sharing", userId] as const,
    accessible: (userId: string) =>
      [...queryKeys.vehicles.all, "accessible", userId] as const,
    images: (vehicleId: string) =>
      [...queryKeys.vehicles.all, "images", vehicleId] as const,
  },

  // ============================================================================
  // Fuel Logs
  // ============================================================================
  fuelLogs: {
    all: ["fuelLogs"] as const,
    lists: () => [...queryKeys.fuelLogs.all, "list"] as const,
    list: (vehicleId?: string) =>
      vehicleId
        ? [...queryKeys.fuelLogs.lists(), vehicleId]
        : [...queryKeys.fuelLogs.lists()],
    listByUser: (userId: string) =>
      [...queryKeys.fuelLogs.all, "user", userId] as const,
    listByDateRange: (vehicleId: string, startDate: string, endDate: string) =>
      [...queryKeys.fuelLogs.lists(), vehicleId, startDate, endDate] as const,
    details: () => [...queryKeys.fuelLogs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.fuelLogs.details(), id] as const,
    latest: (vehicleId: string) =>
      [...queryKeys.fuelLogs.all, "latest", vehicleId] as const,
  },

  // ============================================================================
  // Service Logs
  // ============================================================================
  serviceLogs: {
    all: ["serviceLogs"] as const,
    lists: () => [...queryKeys.serviceLogs.all, "list"] as const,
    list: (vehicleId?: string) =>
      vehicleId
        ? [...queryKeys.serviceLogs.lists(), vehicleId]
        : [...queryKeys.serviceLogs.lists()],
    listByUser: (userId: string) =>
      [...queryKeys.serviceLogs.all, "user", userId] as const,
    listByType: (vehicleId: string, serviceType: string) =>
      [...queryKeys.serviceLogs.lists(), vehicleId, serviceType] as const,
    details: () => [...queryKeys.serviceLogs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.serviceLogs.details(), id] as const,
    upcoming: (vehicleId: string) =>
      [...queryKeys.serviceLogs.all, "upcoming", vehicleId] as const,
  },

  // ============================================================================
  // Mileage Logs
  // ============================================================================
  mileageLogs: {
    all: ["mileageLogs"] as const,
    lists: () => [...queryKeys.mileageLogs.all, "list"] as const,
    list: (vehicleId?: string) =>
      vehicleId
        ? [...queryKeys.mileageLogs.lists(), vehicleId]
        : [...queryKeys.mileageLogs.lists()],
    listByUser: (userId: string) =>
      [...queryKeys.mileageLogs.all, "user", userId] as const,
    details: () => [...queryKeys.mileageLogs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.mileageLogs.details(), id] as const,
    latest: (vehicleId: string) =>
      [...queryKeys.mileageLogs.all, "latest", vehicleId] as const,
  },

  // ============================================================================
  // Groups
  // ============================================================================
  groups: {
    all: ["groups"] as const,
    lists: () => [...queryKeys.groups.all, "list"] as const,
    list: (userId: string) => [...queryKeys.groups.lists(), userId] as const,
    listOwned: (userId: string) =>
      [...queryKeys.groups.all, "owned", userId] as const,
    listMember: (userId: string) =>
      [...queryKeys.groups.all, "member", userId] as const,
    details: () => [...queryKeys.groups.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
    members: (groupId: string) =>
      [...queryKeys.groups.all, "members", groupId] as const,
    vehicles: (groupId: string) =>
      [...queryKeys.groups.all, "vehicles", groupId] as const,
  },

  // ============================================================================
  // Invitations
  // ============================================================================
  invitations: {
    all: ["invitations"] as const,
    lists: () => [...queryKeys.invitations.all, "list"] as const,
    pending: (userId: string) =>
      [...queryKeys.invitations.all, "pending", userId] as const,
    pendingByEmail: (email: string) =>
      [...queryKeys.invitations.all, "pending", "email", email] as const,
    sent: (groupId: string) =>
      [...queryKeys.invitations.all, "sent", groupId] as const,
    detail: (id: string) =>
      [...queryKeys.invitations.all, "detail", id] as const,
  },

  // ============================================================================
  // Notifications
  // ============================================================================
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (userId: string) =>
      [...queryKeys.notifications.lists(), userId] as const,
    unread: (userId: string) =>
      [...queryKeys.notifications.all, "unread", userId] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.notifications.all, "unreadCount", userId] as const,
    detail: (notificationId: string) =>
      [...queryKeys.notifications.all, "detail", notificationId] as const,
  },

  // ============================================================================
  // Notification Preferences
  // ============================================================================
  notificationPreferences: {
    all: ["notificationPreferences"] as const,
    detail: (userId: string) =>
      [...queryKeys.notificationPreferences.all, userId] as const,
  },

  // ============================================================================
  // Analytics
  // ============================================================================
  analytics: {
    all: ["analytics"] as const,
    dashboard: (userId: string) =>
      [...queryKeys.analytics.all, "dashboard", userId] as const,
    costs: (userId: string, period?: string) =>
      [...queryKeys.analytics.all, "costs", userId, period] as const,
    fuel: (userId: string, vehicleId?: string) =>
      [...queryKeys.analytics.all, "fuel", userId, vehicleId] as const,
    service: (userId: string, vehicleId?: string) =>
      [...queryKeys.analytics.all, "service", userId, vehicleId] as const,
    performance: (vehicleId: string) =>
      [...queryKeys.analytics.all, "performance", vehicleId] as const,
    trends: (userId: string, period: string) =>
      [...queryKeys.analytics.all, "trends", userId, period] as const,
  },

  // ============================================================================
  // User / Profile
  // ============================================================================
  user: {
    all: ["user"] as const,
    current: () => [...queryKeys.user.all, "current"] as const,
    profile: (userId: string) =>
      [...queryKeys.user.all, "profile", userId] as const,
    preferences: (userId: string) =>
      [...queryKeys.user.all, "preferences", userId] as const,
  },

  // ============================================================================
  // User Data (for notification service compatibility)
  // ============================================================================
  userData: {
    all: ["userData"] as const,
    groups: (userId: string) => ["userData", "groups", userId] as const,
    vehicles: (userId: string) => ["userData", "vehicles", userId] as const,
    sharedVehicles: (groupIds: string[]) =>
      ["userData", "sharedVehicles", groupIds] as const,
  },

  // ============================================================================
  // Join Requests
  // ============================================================================
  joinRequests: {
    all: ["joinRequests"] as const,
    pending: (userId: string) => ["joinRequests", "pending", userId] as const,
  },

  // ============================================================================
  // Service Templates
  // ============================================================================
  serviceTemplates: {
    all: ["serviceTemplates"] as const,
    lists: () => [...queryKeys.serviceTemplates.all, "list"] as const,
    list: (userId: string) =>
      [...queryKeys.serviceTemplates.lists(), userId] as const,
    detail: (id: string) =>
      [...queryKeys.serviceTemplates.all, "detail", id] as const,
  },

  // ============================================================================
  // Dashboard
  // ============================================================================
  dashboard: {
    all: ["dashboard"] as const,
    summary: (userId: string) =>
      [...queryKeys.dashboard.all, "summary", userId] as const,
    recentActivity: (userId: string) =>
      [...queryKeys.dashboard.all, "recentActivity", userId] as const,
    stats: (userId: string) =>
      [...queryKeys.dashboard.all, "stats", userId] as const,
  },
} as const;

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;
