import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  checkPasswordRequirements,
  PASSWORD_REQUIREMENTS,
  PasswordRequirements,
} from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const requirements = useMemo(
    () => checkPasswordRequirements(password),
    [password],
  );

  const metCount = useMemo(
    () => Object.values(requirements).filter(Boolean).length,
    [requirements],
  );

  const strength = useMemo(() => {
    if (metCount === 5) return "strong";
    if (metCount >= 3) return "medium";
    return "weak";
  }, [metCount]);

  const strengthColor = useMemo(() => {
    switch (strength) {
      case "strong":
        return colors.success || "#10B981";
      case "medium":
        return colors.warning || "#F59E0B";
      default:
        return colors.error || "#EF4444";
    }
  }, [strength, colors]);

  const strengthLabel = useMemo(() => {
    switch (strength) {
      case "strong":
        return "Strong password";
      case "medium":
        return "Medium strength";
      default:
        return "Weak password";
    }
  }, [strength]);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  const requirementKeys: (keyof PasswordRequirements)[] = [
    "minLength",
    "hasUppercase",
    "hasLowercase",
    "hasNumber",
    "hasSpecialChar",
  ];

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBarContainer}>
        <View
          style={[
            styles.strengthBarBackground,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.strengthBarFill,
              {
                backgroundColor: strengthColor,
                width: `${(metCount / 5) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, { color: strengthColor }]}>
          {strengthLabel}
        </Text>
      </View>

      {/* Requirements List */}
      {showRequirements && (
        <View style={styles.requirementsList}>
          {PASSWORD_REQUIREMENTS.map((req, index) => {
            const isMet = requirements[requirementKeys[index]];
            return (
              <View key={req.key} style={styles.requirementItem}>
                <Ionicons
                  name={isMet ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={
                    isMet ? colors.success || "#10B981" : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: isMet ? colors.text : colors.textSecondary,
                      textDecorationLine: isMet ? "none" : "none",
                    },
                  ]}
                >
                  {req.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  strengthBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  strengthBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginRight: 12,
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
    minWidth: 100,
    textAlign: "right",
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
  },
});
