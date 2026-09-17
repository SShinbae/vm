import { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../../services/supabaseClient";
import {
  useDeleteAllNotifications as useDeleteAllNotificationsMutation,
  useDeleteNotification as useDeleteNotificationMutation,
  useMarkAllNotificationsAsRead as useMarkAllAsReadMutation,
  useMarkNotificationAsRead as useMarkAsReadMutation,
  useNotifications as useNotificationsQuery,
} from "../../hooks/useNotificationQueries";
import { queryKeys } from "../config/queryClient";
import { migratePreferencesFromAsyncStorage } from "../services/notificationPreferencesService";
import { NotificationData } from "../services/notificationService";
import {
  hasMigratedNotifications,
  migrateNotificationsFromStorage,
} from "../utils/notificationMigration";

interface NotificationContextType {
  notifications: NotificationData[];
  latestNotification: NotificationData | null;
  unreadCount: number;
  isInitialized: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);
const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [latestNotification, setLatestNotification] =
    useState<NotificationData | null>(null);
  const { data: notifications = [], refetch } = useNotificationsQuery(userId);
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();
  const deleteAllNotificationsMutation = useDeleteAllNotificationsMutation();

  const subscribe = useCallback(
    (id: string) =>
      supabase
        .channel(`user-notifications-${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${id}`,
          },
          (payload) => {
            const notification = payload.new as NotificationData;
            setLatestNotification(notification);
            queryClient.setQueryData(
              queryKeys.notifications.list(id),
              (old: NotificationData[] | undefined) =>
                [
                  notification,
                  ...(old || []).filter((item) => item.id !== notification.id),
                ].slice(0, MAX_NOTIFICATIONS),
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${id}`,
          },
          (payload) => {
            const updated = payload.new as NotificationData;
            queryClient.setQueryData(
              queryKeys.notifications.list(id),
              (old: NotificationData[] | undefined) =>
                old?.map((item) => (item.id === updated.id ? updated : item)),
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${id}`,
          },
          (payload) => {
            queryClient.setQueryData(
              queryKeys.notifications.list(id),
              (old: NotificationData[] | undefined) =>
                old?.filter((item) => item.id !== payload.old.id),
            );
          },
        )
        .subscribe(),
    [queryClient],
  );

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const initialize = async (id?: string) => {
      const activeId = id || (await supabase.auth.getUser()).data.user?.id;
      if (!activeId) {
        setIsInitialized(true);
        return;
      }

      setUserId(activeId);
      await Promise.allSettled([
        hasMigratedNotifications().then((migrated) =>
          migrated ? undefined : migrateNotificationsFromStorage(activeId),
        ),
        migratePreferencesFromAsyncStorage(activeId),
      ]);
      channel?.unsubscribe();
      channel = subscribe(activeId);
      setIsInitialized(true);
    };

    initialize();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => initialize(session.user.id), 0);
      } else if (event === "SIGNED_OUT") {
        channel?.unsubscribe();
        channel = null;
        queryClient.clear();
        setUserId(null);
        setLatestNotification(null);
        setIsInitialized(false);
      }
    });

    return () => {
      channel?.unsubscribe();
      subscription.unsubscribe();
    };
  }, [queryClient, subscribe]);

  const refreshNotifications = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        latestNotification,
        unreadCount: notifications.filter((item) => !item.read).length,
        isInitialized,
        markAsRead: (id) => markAsReadMutation.mutate(id),
        markAllAsRead: () => userId && markAllAsReadMutation.mutate(userId),
        clearNotification: (id) => deleteNotificationMutation.mutate(id),
        clearAllNotifications: () =>
          userId && deleteAllNotificationsMutation.mutate(userId),
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
