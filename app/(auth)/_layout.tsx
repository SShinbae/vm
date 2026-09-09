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
        name="login"
        options={{
          title: "Sign In",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Create Account",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: "Reset Password",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="email-confirmation"
        options={{
          title: "Email Confirmation",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="confirmation-success"
        options={{
          title: "Account Confirmed",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: "Reset Password",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
