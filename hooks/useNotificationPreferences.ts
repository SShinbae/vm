import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/config/queryKeys";
import {
  getPreferences,
  upsertPreferences,
} from "@/lib/services/notificationPreferencesService";
import { oneSignalService } from "@/lib/services/oneSignalService";
import { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["notification_preferences"]["Row"];
type Update =
  Database["public"]["Tables"]["notification_preferences"]["Update"];

/**
 * Fetch notification preferences for a user
 */
export function useNotificationPreferences(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.notificationPreferences.detail(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const res = await getPreferences(userId);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes — preferences rarely change
  });
}

/**
 * Update notification preferences with optimistic update
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<Update>;
    }) => {
      const res = await upsertPreferences(userId, data);
      if (res.error) throw new Error(res.error);

      // Sync preference tags to OneSignal for server-side filtering
      try {
        if (res.data) await oneSignalService.syncPreferenceTags(res.data);
      } catch {
        // Non-critical — don't fail the mutation
      }

      return res.data;
    },
    onMutate: async ({ userId, data }) => {
      const queryKey = queryKeys.notificationPreferences.detail(userId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Row | null>(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: Row | null | undefined) => {
        if (!old) {
          // Create optimistic row with defaults
          return { user_id: userId, ...data } as Row;
        }
        return { ...old, ...data };
      });

      return { previous, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: (_data, _error, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationPreferences.detail(userId),
      });
    },
  });
}

/**
 * Snooze a notification type
 */
export function useSnoozeNotificationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      notificationType,
      snoozedUntil,
    }: {
      userId: string;
      notificationType: string;
      snoozedUntil: string; // ISO timestamp
    }) => {
      // First get current snoozed_types
      const current = await getPreferences(userId);
      const currentSnoozed = current.data
        ? (current.data.snoozed_types as Record<string, string>)
        : {};

      const newSnoozed = {
        ...currentSnoozed,
        [notificationType]: snoozedUntil,
      };

      const res = await upsertPreferences(userId, {
        snoozed_types: newSnoozed,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSettled: (_data, _error, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationPreferences.detail(userId),
      });
    },
  });
}
