import React from "react";
import { Href, Link } from "expo-router";
import { Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export type BreadcrumbItem = { label: string; href?: Href };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { theme } = useStyles();
  return (
    <View
      role="navigation"
      aria-label="Breadcrumb"
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
      }}
    >
      {items.map((item, index) => {
        const current = index === items.length - 1;
        return (
          <React.Fragment key={`${index}-${item.label}`}>
            {index > 0 && (
              <Text aria-hidden style={{ color: theme.colors.textSecondary }}>
                ›
              </Text>
            )}
            {!current && item.href ? (
              <Link
                href={item.href}
                style={{
                  color: theme.colors.primary,
                  fontSize: theme.fontSize.sm,
                  flexShrink: 1,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                {item.label}
              </Link>
            ) : (
              <Text
                aria-current={current ? "page" : undefined}
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  flexShrink: 1,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                {item.label}
              </Text>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
