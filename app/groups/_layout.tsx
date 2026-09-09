import { useStyles } from "react-native-unistyles";
import { Stack } from "expo-router";

export default function GroupsLayout() {
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
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/invite" />
    </Stack>
  );
}
