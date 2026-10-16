import { createStyleSheet } from "react-native-unistyles";

export const formPageStyles = createStyleSheet((theme) => ({
  content: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    shadowOpacity: 0,
    elevation: 0,
  },
}));
