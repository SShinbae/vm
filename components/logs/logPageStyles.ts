import { createStyleSheet } from "react-native-unistyles";
export { formPageStyles as logPageStyles } from "@/components/layout/formPageStyles";

export const compactLogFormStyles = createStyleSheet(() => ({
  content: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  panel: { padding: 0, borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  header: { paddingHorizontal: 16, gap: 8 },
  back: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
  },
  row: { flexDirection: "column", gap: 0 },
  footer: { flexDirection: "column", gap: 12 },
  button: { flex: 0, minHeight: 48 },
  choice: { minHeight: 48, flexShrink: 1, maxWidth: "100%" },
  choiceText: { flexShrink: 1 },
}));
