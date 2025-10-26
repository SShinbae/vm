import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { AnalyticsPeriod } from "../../types/analytics";

interface PeriodSelectorProps {
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  periods: AnalyticsPeriod[];
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  periods,
}: PeriodSelectorProps) {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time Period</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {periods.map((period) => {
          const isSelected = period.label === selectedPeriod.label;
          return (
            <TouchableOpacity
              key={period.label}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onPeriodChange(period)}
            >
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  chip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
}));
