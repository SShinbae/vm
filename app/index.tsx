import { ClosingCta } from "@/components/landing/ClosingCta";
import { Faq } from "@/components/landing/Faq";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  LandingNav,
  NAV_BAR_HEIGHT,
  SectionKey,
} from "@/components/landing/LandingNav";
import { Section, useBreakpoint } from "@/components/landing/layout";
import { SkeletonLanding } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Redirect } from "expo-router";
import React, { useRef } from "react";
import { LayoutChangeEvent, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

export default function Index() {
  const { user, loading, initialized } = useAuth();
  const { theme } = useStyles();
  const { isMobile } = useBreakpoint();
  const { top } = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<SectionKey, number>>>({});

  if (!initialized || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SkeletonLanding />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const track = (key: SectionKey) => (e: LayoutChangeEvent) => {
    offsets.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToSection = (key: SectionKey) => {
    const y = offsets.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({
        y: y - (NAV_BAR_HEIGHT + top),
        animated: true,
      });
    }
  };

  const sectionPadding = { paddingVertical: isMobile ? 56 : 96 };

  return (
    <ScrollView
      ref={scrollRef}
      stickyHeaderIndices={[0]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <LandingNav onNavigate={scrollToSection} />
      <Hero />
      <Section
        onLayout={track("features")}
        style={[sectionPadding, { backgroundColor: theme.colors.surface }]}
      >
        <FeatureGrid />
      </Section>
      <Section onLayout={track("how")} style={sectionPadding}>
        <HowItWorks />
      </Section>
      <Section
        onLayout={track("faq")}
        style={[sectionPadding, { backgroundColor: theme.colors.surface }]}
      >
        <Faq />
      </Section>
      <Section style={sectionPadding}>
        <ClosingCta />
      </Section>
      <LandingFooter />
    </ScrollView>
  );
}
