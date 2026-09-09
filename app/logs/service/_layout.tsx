import { useStyles } from "react-native-unistyles";
import { Stack } from "expo-router";

export default function ServiceLogsLayout() {
  const { theme } = useStyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </Stack>
  );
}
