import { Text, type TextProps, useColorScheme } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const { theme } = useStyles(stylesheet);
  const { styles } = useStyles(stylesheet);

  const color =
    colorScheme === "dark"
      ? darkColor ||
        (type === "link" ? theme.colors.primary : theme.colors.text)
      : lightColor ||
        (type === "link" ? theme.colors.primary : theme.colors.text);

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const stylesheet = createStyleSheet((theme) => ({
  default: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.fontSize["2xl"],
  },
  defaultSemiBold: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.semibold as any,
  },
  title: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold as any,
    lineHeight: theme.fontSize["3xl"],
  },
  subtitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold as any,
  },
  link: {
    lineHeight: theme.fontSize["3xl"],
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
  },
}));
