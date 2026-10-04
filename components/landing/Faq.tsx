import { spacing } from "@/src/design-system";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { FAQS } from "./content";
import { SectionHeading } from "./SectionHeading";

// ponytail: own accordion rather than ui/Collapsible — that one has no a11y state and indents content for settings lists.
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const { theme } = useStyles();
  const [open, setOpen] = useState(false);

  return (
    <View
      style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
    >
      <TouchableOpacity
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.lg,
          paddingVertical: spacing.xl,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: "600",
            color: theme.colors.text,
          }}
        >
          {question}
        </Text>
        <Ionicons
          name={open ? "remove" : "add"}
          size={22}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      {open && (
        <Text
          style={{
            fontSize: 16,
            lineHeight: 25,
            color: theme.colors.textSecondary,
            paddingBottom: spacing.xl,
            paddingRight: spacing.xxl,
          }}
        >
          {answer}
        </Text>
      )}
    </View>
  );
}

export function Faq() {
  return (
    <View style={{ maxWidth: 760, width: "100%", alignSelf: "center" }}>
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      {FAQS.map((faq) => (
        <FaqItem key={faq.question} {...faq} />
      ))}
    </View>
  );
}
