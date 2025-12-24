import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { queryKeys } from "@/lib/config/queryClient";
import { NotificationData } from "@/lib/services/notificationService";
import { Database } from "@/types/database";

const MAX_NOTIFICATIONS = 50;

/**
 * Fetch notifications from database with React Query
 */
export function useNotifications(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_NOTIFICATIONS);

      if (error) throw error;
      return (data || []) as NotificationData[];
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });
}

/**
 * Fetch user's groups (parallelized for better performance)
 */
export function useUserGroups(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.userData.groups(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (error) throw error;
      return ((data || []) as { group_id: string }[]).map((g) => g.group_id);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Groups don't change often, cache for 5 minutes
  });
}

/**
 * Fetch user's vehicles (parallelized for better performance)
 */
export function useUserVehicles(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.userData.vehicles(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", userId);

      if (error) throw error;
      return ((data || []) as { id: string }[]).map((v) => v.id);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Vehicles don't change often, cache for 5 minutes
  });
}

/**
 * Fetch shared vehicles through groups (depends on groups query)
 */
export function useSharedVehicles(groupIds: string[] | undefined) {
  return useQuery({
    queryKey: queryKeys.userData.sharedVehicles(groupIds || []),
    queryFn: async () => {
      if (!groupIds || groupIds.length === 0) return [];

      const { data, error } = await supabase
        .from("vehicle_group_shares")
        .select("vehicle_id")
        .in("group_id", groupIds);

      if (error) throw error;
      return ((data || []) as { vehicle_id: string }[]).map(
        (sv) => sv.vehicle_id,
      );
    },
    enabled: !!groupIds && groupIds.length > 0,
    staleTime: 5 * 60 * 1000, // Shared vehicles don't change often
  });
}

/**
 * Combined hook that fetches all user data in parallel
 * This replaces the sequential loadUserData() calls
 */
export function useUserData(userId: string | null | undefined) {
  const groupsQuery = useUserGroups(userId);
  const vehiclesQuery = useUserVehicles(userId);
  const sharedVehiclesQuery = useSharedVehicles(groupsQuery.data);

  return {
    groupIds: groupsQuery.data || [],
    vehicleIds: [
      ...(vehiclesQuery.data || []),
      ...(sharedVehiclesQuery.data || []),
    ],
    isLoading:
      groupsQuery.isLoading ||
      vehiclesQuery.isLoading ||
      sharedVehiclesQuery.isLoading,
    isError:
      groupsQuery.isError ||
      vehiclesQuery.isError ||
      sharedVehiclesQuery.isError,
    refetch: async () => {
      await Promise.all([
        groupsQuery.refetch(),
        vehiclesQuery.refetch(),
        sharedVehiclesQuery.refetch(),
      ]);
    },
  };
}

/**
 * Mark notification as read with optimistic updates
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const updateData: Database["public"]["Tables"]["notifications"]["Update"] =
        { read: true };

      const { error } = await (supabase.from("notifications") as any)
        .update(updateData)
        .eq("id", notificationId);

      if (error) throw error;
      return notificationId;
    },
    // Optimistic update - update UI immediately before server responds
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      });

      // Optimistically update to the new value
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (old: NotificationData[] | undefined) => {
          if (!old) return old;
          return old.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification,
          );
        },
      );

      // Return context with snapshot
      return { previousNotifications };
    },
    // If mutation fails, rollback to previous value
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error marking notification as read:", err);
    },
    // Always refetch after error or success to ensure server state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Mark all notifications as read with optimistic updates
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const updateData: Database["public"]["Tables"]["notifications"]["Update"] =
        { read: true };

      const { error } = await (supabase.from("notifications") as any)
        .update(updateData)
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      });

      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (old: NotificationData[] | undefined) => {
          if (!old) return old;
          return old.map((notification) => ({ ...notification, read: true }));
        },
      );

      return { previousNotifications };
    },
    onError: (err, userId, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error marking all notifications as read:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Delete a notification with optimistic updates
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    // Optimistic update
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      });

      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (old: NotificationData[] | undefined) => {
          if (!old) return old;
          return old.filter(
            (notification) => notification.id !== notificationId,
          );
        },
      );

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error deleting notification:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Delete all notifications for a user with optimistic updates
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      });

      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        () => [],
      );

      return { previousNotifications };
    },
    onError: (err, userId, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error deleting all notifications:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
