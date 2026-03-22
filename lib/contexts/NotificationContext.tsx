import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import {
  NotificationData,
  notificationService,
} from "../services/notificationService";
import {
  migrateNotificationsFromStorage,
  hasMigratedNotifications,
} from "../utils/notificationMigration";
import {
  useNotifications as useNotificationsQuery,
  useMarkNotificationAsRead as useMarkAsReadMutation,
  useMarkAllNotificationsAsRead as useMarkAllAsReadMutation,
  useDeleteNotification as useDeleteNotificationMutation,
  useDeleteAllNotifications as useDeleteAllNotificationsMutation,
} from "../../hooks/useNotificationQueries";
import { queryKeys } from "../config/queryClient";

interface NotificationContextType {
  notifications: NotificationData[];
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

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use React Query for notifications - automatic caching and background refetching
  const { data: notifications = [], refetch: refetchNotifications } =
    useNotificationsQuery(userId);

  // Mutations with optimistic updates
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();
  const deleteAllNotificationsMutation = useDeleteAllNotificationsMutation();

  // Setup realtime subscription for notifications
  const setupRealtimeSubscription = useCallback(
    (userId: string) => {
      const channel = supabase
        .channel("user-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as NotificationData;
            // Update React Query cache directly
            queryClient.setQueryData(
              queryKeys.notifications.list(userId),
              (old: NotificationData[] | undefined) => {
                if (!old) return [newNotification];
                return [newNotification, ...old].slice(0, MAX_NOTIFICATIONS);
              },
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedNotification = payload.new as NotificationData;
            // Update React Query cache directly
            queryClient.setQueryData(
              queryKeys.notifications.list(userId),
              (old: NotificationData[] | undefined) => {
                if (!old) return old;
                return old.map((n) =>
                  n.id === updatedNotification.id ? updatedNotification : n,
                );
              },
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const deletedId = payload.old.id;
            // Update React Query cache directly
            queryClient.setQueryData(
              queryKeys.notifications.list(userId),
              (old: NotificationData[] | undefined) => {
                if (!old) return old;
                return old.filter((n) => n.id !== deletedId);
              },
            );
          },
        )
        .subscribe();

      return channel;
    },
    [queryClient],
  );

  // Mark notification as read using React Query mutation
  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation],
  );

  // Mark all notifications as read using React Query mutation
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    markAllAsReadMutation.mutate(userId);
  }, [userId, markAllAsReadMutation]);

  // Delete single notification using React Query mutation
  const clearNotification = useCallback(
    (notificationId: string) => {
      deleteNotificationMutation.mutate(notificationId);
    },
    [deleteNotificationMutation],
  );

  // Delete all notifications using React Query mutation
  const clearAllNotifications = useCallback(async () => {
    if (!userId) return;
    deleteAllNotificationsMutation.mutate(userId);
  }, [userId, deleteAllNotificationsMutation]);

  // Refresh notifications - React Query handles this efficiently with cache
  const refreshNotifications = useCallback(async () => {
    try {
      // Refetch notifications from database
      await refetchNotifications();

      // Only refresh user data if cache is expired (handled internally by notificationService)
      await notificationService.refreshUserData();
    } catch (error) {
      if (__DEV__) {
        console.error("Error refreshing notifications:", error);
      }
    }
  }, [refetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  // Initialize on mount and when auth state changes
  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    let currentChannel: RealtimeChannel | null = null;
    let notificationCallback:
      | ((notification: NotificationData) => void)
      | null = null;

    const initialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsInitialized(true);
          return;
        }

        setUserId(user.id);

        // OPTIMIZATION: Run migration check, and initialization in parallel
        if (__DEV__) {
          console.log("🚀 Starting parallel initialization...");
        }

        try {
          await Promise.all([
            // Migration check (non-blocking for fetch)
            (async () => {
              if (__DEV__) {
                console.log("📦 Starting migration check...");
              }
              const migrated = await hasMigratedNotifications();
              if (!migrated) {
                if (__DEV__) {
                  console.log("Migrating notifications from AsyncStorage...");
                }
                const result = await migrateNotificationsFromStorage(user.id);
                if (result.success) {
                  if (__DEV__) {
                    console.log(`Migrated ${result.count} notifications`);
                  }
                } else {
                  if (__DEV__) {
                    console.error("Migration failed:", result.error);
                  }
                }
              }
              if (__DEV__) {
                console.log("✅ Migration check complete");
              }
            })(),

            // Initialize notification service (fetches groups/vehicles with cache)
            (async () => {
              if (__DEV__) {
                console.log("🔧 Initializing notification service...");
              }
              await notificationService.initialize(user.id);
              if (__DEV__) {
                console.log("✅ Notification service initialized");
              }
            })(),
          ]);

          if (__DEV__) {
            console.log("✅ All parallel operations complete");
          }
        } catch (error) {
          if (__DEV__) {
            console.error("❌ Error in parallel initialization:", error);
          }
          throw error;
        }

        // Add callback to save notifications from notificationService to database
        notificationCallback = async (notification: NotificationData) => {
          if (__DEV__) {
            console.log(
              "💾 NotificationContext callback triggered!",
              notification,
            );
          }
          try {
            if (__DEV__) {
              console.log(
                "💾 Attempting to insert notification into database...",
              );
            }
            const { data, error } = await supabase
              .from("notifications")
              .insert({
                user_id: notification.user_id,
                notification_type: notification.notification_type,
                title: notification.title,
                body: notification.body,
                data: notification.data,
                read: notification.read,
                related_vehicle_id: notification.related_vehicle_id,
                related_group_id: notification.related_group_id,
                action_url: notification.action_url,
              } as any);

            if (error) {
              if (__DEV__) {
                console.error(
                  "❌ Error saving notification to database:",
                  error,
                );
              }
            } else {
              if (__DEV__) {
                console.log(
                  "✅ Notification saved to database successfully!",
                  data,
                );
              }

              // Invalidate React Query cache to trigger refetch
              queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.list(user.id),
              });
            }
          } catch (error) {
            if (__DEV__) {
              console.error("❌ Error in saveNotificationCallback:", error);
            }
          }
        };

        if (__DEV__) {
          console.log("🔧 Adding callback to notificationService...");
        }
        notificationService.addCallback(notificationCallback);
        if (__DEV__) {
          console.log("✅ Callback added to notificationService");
        }

        // Setup realtime subscription after data is loaded
        currentChannel = setupRealtimeSubscription(user.id);

        setIsInitialized(true);
      } catch (error) {
        if (__DEV__) {
          console.error("Error initializing notifications:", error);
        }
        setIsInitialized(true);
      }
    };

    const initializeAndListen = async () => {
      await initialize();

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Cleanup old channel and callback before reinitializing
          if (currentChannel) {
            currentChannel.unsubscribe();
            currentChannel = null;
          }
          if (notificationCallback) {
            notificationService.removeCallback(notificationCallback);
            notificationCallback = null;
          }
          // Defer initialize to run AFTER the callback returns and the auth lock is released.
          // Calling getUser()/getSession() inside onAuthStateChange causes a deadlock
          // because _notifyAllSubscribers waits for callbacks while holding the lock.
          setTimeout(() => initialize(), 0);
        } else if (event === "SIGNED_OUT") {
          // Cleanup
          if (notificationCallback) {
            notificationService.removeCallback(notificationCallback);
            notificationCallback = null;
          }
          notificationService.cleanup();
          if (currentChannel) {
            currentChannel.unsubscribe();
            currentChannel = null;
          }

          // Clear React Query cache
          queryClient.clear();
          setUserId(null);
          setIsInitialized(false);
        }
      });

      authSubscription = subscription;
    };

    initializeAndListen();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (currentChannel) {
        currentChannel.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isInitialized,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
