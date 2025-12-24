import React from "react";
import { View, ViewProps, StyleSheet, Platform } from "react-native";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export interface MaxWidthContainerProps extends ViewProps {
  children: React.ReactNode;
  /** Disable max-width constraint (for special cases) */
  fullWidth?: boolean;
  /** Additional horizontal padding beyond contentPadding */
  extraPadding?: number;
  /** Center content horizontally */
  center?: boolean;
}

/**
 * MaxWidthContainer - Enforces maximum content width on desktop
 *
 * Only applies constraints on web desktop (Platform.OS === 'web' && isDesktop)
 * Mobile and tablet render children without constraints
 *
 * @example
 * <MaxWidthContainer>
 *   <YourContent />
 * </MaxWidthContainer>
 */
export function MaxWidthContainer({
  children,
  fullWidth = false,
  extraPadding = 0,
  center = true,
  style,
  ...props
}: MaxWidthContainerProps) {
  const layout = useResponsiveLayout();

  // On mobile/tablet or when fullWidth is true, render without constraints
  if (!layout.isWeb || !layout.isDesktop || fullWidth) {
    return (
      <View style={[{ flex: 1 }, style]} {...props}>
        {children}
      </View>
    );
  }

  // Desktop: apply max-width constraints
  return (
    <View
      style={[
        styles.container,
        center && styles.centered,
        {
          maxWidth: layout.maxContentWidth,
          paddingHorizontal: layout.contentPadding + extraPadding,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: {
        marginLeft: "auto",
        marginRight: "auto",
      },
    }),
  },
  centered: {
    alignSelf: "center",
  },
});
