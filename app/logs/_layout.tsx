import { useStyles } from "react-native-unistyles";
import { Stack } from "expo-router";

export default function LogsLayout() {
  const { theme } = useStyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen name="mileage" options={{ headerShown: false }} />
      <Stack.Screen name="fuel" options={{ headerShown: false }} />
      <Stack.Screen name="service" options={{ headerShown: false }} />
    </Stack>
  );
}
