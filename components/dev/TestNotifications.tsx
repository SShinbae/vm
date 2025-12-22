/**
 * Development component for testing notifications
 * Add this to your profile or settings screen during development
 * Remove before production!
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { supabase } from "../../services/supabaseClient";
import { Database } from "../../types/database";

export function TestNotifications() {
  const [loading, setLoading] = useState(false);

  const createTestNotification = async (
    type:
      | "group_invite"
      | "fuel_log"
      | "service_log"
      | "mileage_log"
      | "group_member",
  ) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Not authenticated");
        return;
      }

      const notifications = {
        group_invite: {
          title: "Test Group Invitation",
          body: "You have been invited to join Test Group",
          data: { inviterName: "Test User", invitationId: "test-123" },
          related_group_id: null,
        },
        fuel_log: {
          title: "New Fuel Log",
          body: "Test User added fuel log for 2023 Tesla Model 3",
          data: { action: "INSERT", userName: "Test User" },
          related_vehicle_id: null,
        },
        service_log: {
          title: "New Service Log",
          body: "Test User added service log for 2023 Tesla Model 3",
          data: { action: "INSERT", userName: "Test User" },
          related_vehicle_id: null,
        },
        mileage_log: {
          title: "New Mileage Log",
          body: "Test User added mileage log for 2023 Tesla Model 3",
          data: { action: "INSERT", userName: "Test User" },
          related_vehicle_id: null,
        },
        group_member: {
          title: "New Group Member",
          body: "Test User joined Engineering Team",
          data: { action: "INSERT", userName: "Test User" },
          related_group_id: null,
        },
      };

      const notification = notifications[type];

      const insertData: Database["public"]["Tables"]["notifications"]["Insert"] =
        {
          user_id: user.id,
          notification_type: type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          read: false,
          related_vehicle_id: (notification as any).related_vehicle_id || null,
          related_group_id: (notification as any).related_group_id || null,
          action_url: null,
        };
      const { error } = await (supabase.from("notifications") as any).insert(
        insertData,
      );

      if (error) {
        Alert.alert("Error", `Failed to create notification: ${error.message}`);
        console.error("Error creating test notification:", error);
      } else {
        Alert.alert("Success", `${type} notification created!`);
      }
    } catch (error) {
      Alert.alert("Error", `Failed: ${error}`);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearTestNotifications = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .like("title", "Test%");

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Test notifications cleared!");
      }
    } catch (error) {
      Alert.alert("Error", `Failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Test Notifications (Dev Only)</Text>

      <TouchableOpacity
        style={[styles.button, styles.groupInvite]}
        onPress={() => createTestNotification("group_invite")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Create Group Invite</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.fuelLog]}
        onPress={() => createTestNotification("fuel_log")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Create Fuel Log</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.serviceLog]}
        onPress={() => createTestNotification("service_log")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Create Service Log</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.mileageLog]}
        onPress={() => createTestNotification("mileage_log")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Create Mileage Log</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.groupMember]}
        onPress={() => createTestNotification("group_member")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Create Group Member</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clear]}
        onPress={clearTestNotifications}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Clear Test Notifications</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: These create notifications directly in the database. Check your
        notifications list to see them appear in real-time!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  button: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  groupInvite: {
    backgroundColor: "#3b82f6",
  },
  fuelLog: {
    backgroundColor: "#f59e0b",
  },
  serviceLog: {
    backgroundColor: "#ef4444",
  },
  mileageLog: {
    backgroundColor: "#8b5cf6",
  },
  groupMember: {
    backgroundColor: "#10b981",
  },
  clear: {
    backgroundColor: "#6b7280",
    marginTop: 10,
  },
  note: {
    marginTop: 15,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});
