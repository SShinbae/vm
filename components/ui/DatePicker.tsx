import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IconSymbol } from "./icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface DatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: any;
}

export function DatePicker({
  label,
  value,
  onDateChange,
  placeholder = "Select date",
  required = false,
  style,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();

    // Handle different date formats
    if (dateString.includes("/")) {
      // DD/MM/YYYY format
      const [day, month, year] = dateString.split("/");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateString.includes("-")) {
      // YYYY-MM-DD format (database format)
      return new Date(dateString);
    }

    return new Date();
  };

  const formatDate = (date: Date): string => {
    // Return YYYY-MM-DD format for compatibility with existing system
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    // Display format DD/MM/YYYY for better UX
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      onDateChange(formattedDate);
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const currentDate = value ? parseDate(value) : new Date();
  const displayValue = value
    ? formatDisplayDate(parseDate(value))
    : placeholder;

  // For web platform, we'll use a text input with HTML5 date input as fallback
  const isWeb = Platform.OS === "web";

  const handleTextInputChange = (text: string) => {
    // Handle direct text input for web platform
    if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format from HTML5 date input
      onDateChange(text);
    } else if (text.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      // DD/MM/YYYY format - convert to YYYY-MM-DD
      const [day, month, year] = text.split("/");
      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      onDateChange(formattedDate);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: "#ff4444",
    },
    dateButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateButtonPressed: {
      backgroundColor: colors.icon + "10",
    },
    dateText: {
      fontSize: 16,
      color: value ? colors.text : colors.icon,
    },
    iconContainer: {
      marginLeft: 12,
    },
    webInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.requiredLabel}>*</Text>}
      </Text>

      {isWeb ? (
        // Web fallback: use TextInput with HTML5 date type
        <TextInput
          style={styles.webInput}
          value={value || ""}
          onChangeText={handleTextInputChange}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
          // @ts-ignore - type property is valid for web but not in RN types
          type="date"
        />
      ) : (
        <>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{displayValue}</Text>
            <View style={styles.iconContainer}>
              <IconSymbol name="calendar" size={20} color={colors.icon} />
            </View>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={currentDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              style={{ backgroundColor: colors.background }}
            />
          )}
        </>
      )}
    </View>
  );
}
