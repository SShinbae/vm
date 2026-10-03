import React from "react";
import { useWindowDimensions, View, ViewProps } from "react-native";

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

/** Full-width band with the landing page's horizontal gutter and 1200px content cap. */
export function Section({ style, children, ...rest }: ViewProps) {
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <View
      style={[
        { paddingHorizontal: isMobile ? 20 : isTablet ? "6%" : "8%" },
        style,
      ]}
      {...rest}
    >
      <View style={{ maxWidth: 1200, width: "100%", alignSelf: "center" }}>
        {children}
      </View>
    </View>
  );
}
