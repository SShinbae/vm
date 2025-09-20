import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ServiceLogItem } from '@/types';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from './icon-symbol';

interface ServiceItemsInputProps {
  items: ServiceLogItem[];
  onItemsChange: (items: ServiceLogItem[]) => void;
  readonly?: boolean;
}

export function ServiceItemsInput({ items, onItemsChange, readonly = false }: ServiceItemsInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const updateItem = (index: number, field: keyof ServiceLogItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  };

  const addItem = () => {
    onItemsChange([...items, { description: '', price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 2) { // Maintain minimum 2 rows
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
    }
  };

  const totalCost = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12,
    },
    requiredLabel: {
      color: '#ff4444',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    descriptionInput: {
      flex: 2,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    priceInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      textAlign: 'right',
    },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.icon + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonDisabled: {
      opacity: 0.3,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tint + '10',
      borderWidth: 1,
      borderColor: colors.tint,
      borderStyle: 'dashed',
      borderRadius: 8,
      paddingVertical: 12,
      gap: 8,
      marginTop: 8,
    },
    addButtonText: {
      color: colors.tint,
      fontSize: 14,
      fontWeight: '500',
    },
    totalContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.icon + '20',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.tint,
    },
    headerRow: {
      flexDirection: 'row',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    columnHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.icon,
      textTransform: 'uppercase',
    },
    descriptionHeader: {
      flex: 2,
    },
    priceHeader: {
      flex: 1,
      textAlign: 'right',
      marginRight: 40, // Account for remove button space
    },
  });

  if (readonly) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Service Items</Text>
        <View style={styles.headerRow}>
          <Text style={[styles.columnHeader, styles.descriptionHeader]}>Description</Text>
          <Text style={[styles.columnHeader, styles.priceHeader]}>Price</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={[styles.descriptionInput, { backgroundColor: colors.icon + '10' }]}>
              <Text style={{ color: colors.text }}>{item.description || 'No description'}</Text>
            </View>
            <View style={[styles.priceInput, { backgroundColor: colors.icon + '10' }]}>
              <Text style={{ color: colors.text, textAlign: 'right' }}>
                ${item.price.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.removeButton, styles.removeButtonDisabled]} />
          </View>
        ))}
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalAmount}>RM{totalCost.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Service Items <Text style={styles.requiredLabel}>*</Text>
      </Text>

      <View style={styles.headerRow}>
        <Text style={[styles.columnHeader, styles.descriptionHeader]}>Description</Text>
        <Text style={[styles.columnHeader, styles.priceHeader]}>Price</Text>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <TextInput
            style={styles.descriptionInput}
            value={item.description}
            onChangeText={(text) => updateItem(index, 'description', text)}
            placeholder="Service description..."
            placeholderTextColor={colors.icon}
          />
          <TextInput
            style={styles.priceInput}
            value={item.price.toString()}
            onChangeText={(text) => {
              const price = parseFloat(text) || 0;
              updateItem(index, 'price', price);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.icon}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[
              styles.removeButton,
              items.length <= 2 && styles.removeButtonDisabled
            ]}
            onPress={() => removeItem(index)}
            disabled={items.length <= 2}
          >
            <IconSymbol
              name="minus.circle.fill"
              size={20}
              color={items.length <= 2 ? colors.icon + '50' : '#ff4444'}
            />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addItem}>
        <IconSymbol name="plus.circle" size={16} color={colors.tint} />
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>

      <View style={styles.totalContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalAmount}>RM{totalCost.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

// Helper function to calculate total cost
export const calculateTotalCost = (items: ServiceLogItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
};

// Helper function to validate items
export const validateServiceItems = (items: ServiceLogItem[]): string | null => {
  if (items.length === 0) {
    return 'At least one service item is required';
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.description.trim()) {
      return `Description is required for item ${i + 1}`;
    }
    if (item.price <= 0) {
      return `Price must be greater than 0 for item ${i + 1}`;
    }
  }

  return null;
};

// Helper function to create default items
export const createDefaultServiceItems = (): ServiceLogItem[] => {
  return [
    { description: '', price: 0 },
    { description: '', price: 0 }
  ];
};