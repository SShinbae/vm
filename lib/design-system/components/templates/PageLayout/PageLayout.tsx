import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Spacer } from "../../atoms/Spacer";
import { Text } from "../../atoms/Text";
import { Button } from "../../molecules/Button";
import { PageHeader } from "../../organisms/PageHeader";
import type { PageLayoutProps } from "./PageLayout.types";

export const PageLayout: React.FC<PageLayoutProps> = ({
  header,
  children,
  footer,
  scrollable = true,
  backgroundColor,
  padding = "md",
  safeArea = true,
  keyboardAware = false,
  loading = false,
  error = null,
  onRetry,
  contentStyle,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const paddingValue = tokens.spacing[padding];
  const bgColor = backgroundColor || colors.background;

  const contentContainerStyle = [
    styles.contentContainer,
    { padding: paddingValue },
    contentStyle,
  ];

  // Render loading state
  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: bgColor }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading page"
        {...props}
      >
        {header && <PageHeader {...header} />}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Spacer size="md" />
          <Text color="secondary" align="center">
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: bgColor }]}
        accessibilityRole="alert"
        accessibilityLabel="Error loading page"
        {...props}
      >
        {header && <PageHeader {...header} />}
        <View style={styles.centerContent}>
          <Text variant="heading" size="lg" color="error" align="center">
            Something went wrong
          </Text>
          <Spacer size="sm" />
          <Text color="secondary" align="center">
            {error}
          </Text>
          {onRetry && (
            <>
              <Spacer size="lg" />
              <Button onPress={onRetry} variant="primary">
                Try Again
              </Button>
            </>
          )}
        </View>
      </View>
    );
  }

  // Main content renderer
  const renderContent = () => {
    const content = (
      <>
        {header && <PageHeader {...header} />}
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={contentContainerStyle}>{children}</View>
        )}
        {footer && <View style={styles.footer}>{footer}</View>}
      </>
    );

    if (keyboardAware) {
      return (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {content}
        </KeyboardAvoidingView>
      );
    }

    return content;
  };

  const ContainerComponent = safeArea ? SafeAreaView : View;

  return (
    <ContainerComponent
      style={[styles.container, { backgroundColor: bgColor }]}
      {...props}
    >
      {renderContent()}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
});
