import { useStyles } from "react-native-unistyles";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const { theme } = useStyles();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="confirm"
        options={{
          title: "Email Confirmation",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
