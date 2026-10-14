import { createStyleSheet } from "react-native-unistyles";

export const WEB_PAGE_MAX_WIDTH = 1480;

export const webPageStyles = createStyleSheet((theme) => ({
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: WEB_PAGE_MAX_WIDTH,
    alignSelf: "center",
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  heading: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.lg,
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  logRow: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: theme.spacing.lg,
    marginBottom: 0,
  },
}));
