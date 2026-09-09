import { View, type ViewProps, useColorScheme } from "react-native";
import { useStyles, createStyleSheet } from "react-native-unistyles";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

const stylesheet = createStyleSheet((theme) => ({}));

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const { theme } = useStyles(stylesheet);
  const backgroundColor =
    colorScheme === "dark"
      ? darkColor || theme.colors.background
      : lightColor || theme.colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
