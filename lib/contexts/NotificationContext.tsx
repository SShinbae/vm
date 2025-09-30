import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, NotificationData, NotificationCallback } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { supabase } from '../../services/supabaseClient';

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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'notifications';
const MAX_NOTIFICATIONS = 50;

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load notifications from storage
  const loadNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }, []);

  // Save notifications to storage
  const saveNotifications = useCallback(async (notificationsToSave: NotificationData[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }, []);

  // Add new notification
  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Keep only the latest MAX_NOTIFICATIONS
      const trimmedNotifications = newNotifications.slice(0, MAX_NOTIFICATIONS);
      saveNotifications(trimmedNotifications);
      return trimmedNotifications;
    });
  }, [saveNotifications]);

  // Initialize notification service
  const initializeNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load existing notifications
      await loadNotifications();

      // Initialize notification service
      await notificationService.initialize(user.id);
      notificationService.addCallback(addNotification);

      // Initialize push notifications
      await pushNotificationService.initialize();

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [loadNotifications, addNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Clear single notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  // Refresh notifications (reload user data)
  const refreshNotifications = useCallback(async () => {
    try {
      await notificationService.refreshUserData();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Initialize on mount and when auth state changes
  useEffect(() => {
    const initializeAndListen = async () => {
      await initializeNotifications();

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await initializeNotifications();
        } else if (event === 'SIGNED_OUT') {
          notificationService.cleanup();
          pushNotificationService.cleanup();
          setNotifications([]);
          setIsInitialized(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAndListen();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
      pushNotificationService.cleanup();
    };
  }, [initializeNotifications]);

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
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}