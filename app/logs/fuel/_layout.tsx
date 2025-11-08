import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";

export default function FuelLogsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        headerTintColor: Colors[colorScheme ?? "light"].text,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen name="add" options={{ headerShown: false }} />
    </Stack>
  );
}
