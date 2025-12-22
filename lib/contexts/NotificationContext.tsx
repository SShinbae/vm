import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../services/supabaseClient";
import {
  NotificationData,
  notificationService,
} from "../services/notificationService";
import { Database } from "../../types/database";
import {
  migrateNotificationsFromStorage,
  hasMigratedNotifications,
} from "../utils/notificationMigration";

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
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch notifications from database
  const fetchNotificationsFromDB = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_NOTIFICATIONS);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      if (data) {
        setNotifications(data as NotificationData[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  // Setup realtime subscription for notifications
  const setupRealtimeSubscription = useCallback((userId: string) => {
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
          setNotifications((prev) =>
            [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS),
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
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n,
            ),
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
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
        },
      )
      .subscribe();

    return channel;
  }, []);

  // Mark notification as read in database
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const updateData: Database["public"]["Tables"]["notifications"]["Update"] =
        { read: true };
      const { error } = await (supabase.from("notifications") as any)
        .update(updateData)
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all notifications as read in database
  const markAllAsRead = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const updateData: Database["public"]["Tables"]["notifications"]["Update"] =
        { read: true };
      const { error } = await (supabase.from("notifications") as any)
        .update(updateData)
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  // Delete single notification from database
  const clearNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return;
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // Delete all notifications from database
  const clearAllNotifications = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error clearing all notifications:", error);
        return;
      }

      // Optimistically update local state
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  }, []);

  // Refresh notifications (reload from database)
  const refreshNotifications = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await fetchNotificationsFromDB(user.id);
      await notificationService.refreshUserData();
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, [fetchNotificationsFromDB]);

  // Calculate unread count
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  // Initialize on mount and when auth state changes
  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    let currentChannel: RealtimeChannel | null = null;

    const initialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsInitialized(true);
          return;
        }

        // Check if migration is needed
        const migrated = await hasMigratedNotifications();
        if (!migrated) {
          console.log("Migrating notifications from AsyncStorage...");
          const result = await migrateNotificationsFromStorage(user.id);
          if (result.success) {
            console.log(`Migrated ${result.count} notifications`);
          } else {
            console.error("Migration failed:", result.error);
          }
        }

        // Fetch notifications from database
        await fetchNotificationsFromDB(user.id);

        // Setup realtime subscription and track the channel
        currentChannel = setupRealtimeSubscription(user.id);

        // Initialize notification service for in-app notifications
        await notificationService.initialize(user.id);

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
          // Cleanup old channel before reinitializing
          if (currentChannel) {
            currentChannel.unsubscribe();
            currentChannel = null;
          }
          await initialize();
        } else if (event === "SIGNED_OUT") {
          // Cleanup
          notificationService.cleanup();
          if (currentChannel) {
            currentChannel.unsubscribe();
            currentChannel = null;
          }
          setNotifications([]);
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
