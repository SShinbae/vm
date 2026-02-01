import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
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
  const { width: screenWidth } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallScreen = screenWidth < 380;

  const parseDate = (dateString: string): dayjs.Dayjs => {
    if (!dateString) return dayjs();

    // Handle different date formats
    if (dateString.includes("/")) {
      // DD/MM/YYYY format
      const [day, month, year] = dateString.split("/");
      return dayjs(`${year}-${month}-${day}`);
    } else if (dateString.includes("-")) {
      // YYYY-MM-DD format (database format)
      return dayjs(dateString);
    }

    return dayjs();
  };

  const formatDate = (date: dayjs.Dayjs): string => {
    // Return YYYY-MM-DD format for compatibility with existing system
    return date.format("YYYY-MM-DD");
  };

  const formatDisplayDate = (date: dayjs.Dayjs): string => {
    // Display format DD/MM/YYYY for better UX
    return date.format("DD/MM/YYYY");
  };

  const handleDateChange = (params: any) => {
    const selectedDate = params.date;
    if (selectedDate) {
      const formattedDate = formatDate(dayjs(selectedDate));
      onDateChange(formattedDate);
      setShowPicker(false);
    }
  };

  const currentDate = value ? parseDate(value) : dayjs();
  const displayValue = value
    ? formatDisplayDate(parseDate(value))
    : placeholder;

  const styles = StyleSheet.create({
    container: {
      marginBottom: isSmallScreen ? 16 : 20,
    },
    label: {
      fontSize: isSmallScreen ? 13 : 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: isSmallScreen ? 6 : 8,
    },
    requiredLabel: {
      color: "#ff4444",
    },
    dateButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: isSmallScreen ? 10 : 16,
      paddingVertical: isSmallScreen ? 10 : 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: isSmallScreen ? 44 : 48,
    },
    dateText: {
      fontSize: isSmallScreen ? 13 : 16,
      color: value ? colors.text : colors.icon,
      flex: 1,
    },
    iconContainer: {
      marginLeft: isSmallScreen ? 6 : 12,
      flexShrink: 0,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: isSmallScreen ? 16 : 20,
      width: "90%",
      maxWidth: 400,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.icon,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.requiredLabel}>*</Text>}
      </Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>{displayValue}</Text>
        <View style={styles.iconContainer}>
          <IconSymbol name="calendar" size={20} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e: any) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                mode="single"
                date={currentDate.toDate()}
                onChange={handleDateChange}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
