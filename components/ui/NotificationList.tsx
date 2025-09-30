import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../lib/contexts/NotificationContext';
import { NotificationData } from '../../lib/services/notificationService';
import { useThemeColor } from '../../hooks/use-theme-color';
import { formatDistanceToNow } from '../../lib/utils/dateUtils';

interface NotificationItemProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { markAsRead, clearNotification } = useNotifications();
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'tabIconDefault');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');

  const handlePress = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onPress?.(notification);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => clearNotification(notification.id),
        },
      ]
    );
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'mileage_log':
        return 'speedometer-outline';
      case 'fuel_log':
        return 'car-outline';
      case 'service_log':
        return 'construct-outline';
      case 'group_member':
        return 'people-outline';
      case 'group_invite':
        return 'mail-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'mileage_log':
        return '#007AFF';
      case 'fuel_log':
        return '#FF9500';
      case 'service_log':
        return '#FF3B30';
      case 'group_member':
        return '#34C759';
      case 'group_invite':
        return '#AF52DE';
      default:
        return mutedTextColor;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mx-4 mb-3 rounded-lg overflow-hidden"
      style={{ backgroundColor: cardBackground }}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          <View className="mr-3 mt-1">
            <Ionicons
              name={getIcon() as any}
              size={24}
              color={getIconColor()}
            />
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text
                className={`font-semibold text-base ${notification.read ? 'opacity-70' : ''}`}
                style={{ color: textColor }}
              >
                {notification.title}
              </Text>
              {!notification.read && (
                <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-1" />
              )}
            </View>

            <Text
              className={`text-sm mb-2 ${notification.read ? 'opacity-70' : ''}`}
              style={{ color: textColor }}
            >
              {notification.message}
            </Text>

            <View className="flex-row items-center justify-between">
              <Text
                className="text-xs"
                style={{ color: mutedTextColor }}
              >
                {formatDistanceToNow(new Date(notification.timestamp))} ago
              </Text>

              <TouchableOpacity
                onPress={handleDelete}
                className="p-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-outline"
                  size={16}
                  color={mutedTextColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface NotificationListProps {
  onNotificationPress?: (notification: NotificationData) => void;
}

export function NotificationList({ onNotificationPress }: NotificationListProps) {
  const {
    notifications,
    isInitialized,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();

  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'tabIconDefault');
  const backgroundColor = useThemeColor({}, 'background');

  const hasUnreadNotifications = notifications.some(n => !n.read);

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  };

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text style={{ color: mutedTextColor }}>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons
          name="notifications-outline"
          size={64}
          color={mutedTextColor}
        />
        <Text
          className="text-lg font-medium mt-4 mb-2"
          style={{ color: textColor }}
        >
          No notifications
        </Text>
        <Text
          className="text-center"
          style={{ color: mutedTextColor }}
        >
          You&apos;ll see notifications here when group members update logs or when you receive invitations.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Text
          className="text-lg font-semibold"
          style={{ color: textColor }}
        >
          Notifications ({notifications.length})
        </Text>
        <View className="flex-row items-center space-x-3">
          {hasUnreadNotifications && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="px-3 py-1 rounded-md bg-blue-500"
            >
              <Text className="text-white text-sm font-medium">Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleClearAll}
            className="p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={mutedTextColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={onNotificationPress}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}