import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../services/supabaseClient';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  userId: string;
}

class PushNotificationService {
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;

  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return;
    }

    await this.registerForPushNotifications();
    this.setupNotificationListeners();
  }

  private async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission for push notifications denied');
        return null;
      }

      // Get the token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        console.error('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('Push notification token:', token.data);

      // Save token to database
      await this.savePushToken(token.data);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if token already exists
      const { data: existingTokens } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('token', token);

      if (!existingTokens || existingTokens.length === 0) {
        // Insert new token
        const { error } = await supabase
          .from('push_tokens')
          .insert({
            user_id: user.id,
            token,
            platform: Platform.OS,
            device_name: Device.deviceName || 'Unknown Device',
          });

        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Handle notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;

    // Navigate based on notification data
    if (data?.type && data?.id) {
      switch (data.type) {
        case 'log_update':
          if (data.vehicleId) {
            // Navigate to vehicle details
            console.log('Navigate to vehicle:', data.vehicleId);
          }
          break;
        case 'group_invite':
          if (data.groupId) {
            // Navigate to group details
            console.log('Navigate to group:', data.groupId);
          }
          break;
        case 'group_member':
          if (data.groupId) {
            // Navigate to group details
            console.log('Navigate to group:', data.groupId);
          }
          break;
      }
    }
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Show immediately
    });
  }

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const pushNotificationService = new PushNotificationService();