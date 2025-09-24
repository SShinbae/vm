import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { DatePicker } from './ui/DatePicker';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

export type DateRangePreset = 'This Week' | 'This Month' | 'Last 30 Days' | 'Last 3 Months' | 'This Year' | 'Custom';

interface DateRangeFilterProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

export function DateRangeFilter({ selectedRange, onRangeChange }: DateRangeFilterProps) {
  const [showModal, setShowModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(selectedRange.startDate);
  const [customEndDate, setCustomEndDate] = useState(selectedRange.endDate);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getDateRange = (preset: DateRangePreset): DateRange => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date(today);

    switch (preset) {
      case 'This Week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Last 30 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'Last 3 Months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'This Year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'Custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate,
          label: 'Custom Range',
        };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      label: preset,
    };
  };

  const handlePresetSelect = (preset: DateRangePreset) => {
    const range = getDateRange(preset);
    onRangeChange(range);
    if (preset !== 'Custom') {
      setShowModal(false);
    }
  };

  const handleCustomApply = () => {
    onRangeChange({
      startDate: customStartDate,
      endDate: customEndDate,
      label: 'Custom Range',
    });
    setShowModal(false);
  };

  const presets: DateRangePreset[] = [
    'This Week',
    'This Month',
    'Last 30 Days',
    'Last 3 Months',
    'This Year',
    'Custom',
  ];

  const styles = StyleSheet.create({
    triggerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    triggerText: {
      fontSize: 14,
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    presetButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    presetButtonActive: {
      backgroundColor: '#F59E0B20',
      borderColor: '#F59E0B',
    },
    presetText: {
      fontSize: 16,
      color: colors.text,
    },
    customSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#F3F4F6',
    },
    applyButton: {
      backgroundColor: '#F59E0B',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#6B7280',
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#FFFFFF',
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.triggerButton} onPress={() => setShowModal(true)}>
        <IconSymbol name="calendar" size={16} color="#6B7280" />
        <Text style={styles.triggerText}>{selectedRange.label}</Text>
        <IconSymbol name="chevron.down" size={16} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Date Range</Text>

            {presets.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  selectedRange.label === preset && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text style={styles.presetText}>{preset}</Text>
              </TouchableOpacity>
            ))}

            {selectedRange.label === 'Custom Range' && (
              <View style={styles.customSection}>
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onDateChange={setCustomStartDate}
                />
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onDateChange={setCustomEndDate}
                />
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {selectedRange.label === 'Custom Range' && (
                <TouchableOpacity
                  style={[styles.button, styles.applyButton]}
                  onPress={handleCustomApply}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}