import { spacing } from "@/src/design-system";
import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sentryService } from "@/lib/services/sentryService";
import type { ThemeColors } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";

interface Props {
  children: ReactNode;
  colors: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryContent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error);
      console.error("Error Info:", errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    sentryService.captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const styles = createStyles(this.props.colors);
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We&apos;re sorry for the inconvenience. The app encountered an
              unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <Text style={styles.errorText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {!__DEV__ && (
              <Text style={styles.hint}>
                If the problem persists, please try restarting the app or
                contact support.
              </Text>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { theme } = useStyles();
  return (
    <ErrorBoundaryContent colors={theme.colors}>
      {children}
    </ErrorBoundaryContent>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: "center",
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xl,
      lineHeight: 24,
    },
    errorContainer: {
      width: "100%",
      maxHeight: 300,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.lg,
      marginVertical: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.error,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    errorText: {
      fontSize: 12,
      color: colors.text,
      fontFamily: "monospace",
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.lg,
      borderRadius: 8,
      marginTop: spacing.xl,
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xl,
    },
  });
