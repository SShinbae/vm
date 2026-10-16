import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react-native";
import ProfileScreen from "@/app/(tabs)/profile";
import { router } from "expo-router";
import { StyleSheet } from "react-native";

const mockUpdateProfile = jest.fn();
const mockRefreshProfile = jest.fn(async () => {});
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
const mockSetThemeMode = jest.fn();
const mockSignOut = jest.fn();
let mockTab = "Profile";
const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ tab: mockTab }),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "wan@example.com",
      profile: {
        full_name: "Wan Ahnaf",
        username: "wan",
        created_at: "2026-01-01",
      },
    },
    updateProfile: mockUpdateProfile,
    refreshProfile: mockRefreshProfile,
  }),
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@/hooks/useProfileStats", () => ({
  useProfileStats: () => ({
    stats: { totalLogs: 15, activeGroups: 2, daysActive: 30 },
    loading: false,
  }),
}));
jest.mock("@/hooks/useSignOut", () => ({
  useSignOut: () => ({ signOut: mockSignOut, signingOut: false }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));
jest.mock("@/lib/contexts/ThemeContext", () => ({
  useTheme: () => ({ themeMode: "system", setThemeMode: mockSetThemeMode }),
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ visible, children }: any) => (visible ? <>{children}</> : null),
}));
jest.mock("@/components/ui/ImageUpload", () => ({
  ImageUpload: ({ fallbackName, onUploadComplete }: any) => {
    const { Text, Button, View } = require("react-native");
    return (
      <View>
        <Text>Avatar:{fallbackName}</Text>
        <Button
          title="Upload avatar"
          onPress={() => onUploadComplete("user-1/avatar.jpg")}
        />
        <Button title="Delete avatar" onPress={() => onUploadComplete(null)} />
      </View>
    );
  },
}));
jest.mock("@/components/notifications/NotificationPreferencesForm", () => ({
  NotificationPreferencesForm: () => null,
}));
jest.mock("react-native-unistyles", () => ({
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
  createStyleSheet: (factory: any) => factory,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockTab = "Profile";
  mockLayout.isMobile = false;
  mockLayout.isWeb = true;
  mockUpdateProfile.mockResolvedValue({ error: null });
});

it("keeps the profile input mounted when typing and sends trimmed values", async () => {
  render(<ProfileScreen />);
  fireEvent.press(screen.getByText("Edit Profile"));
  const input = screen.getByLabelText("Full Name");
  fireEvent.changeText(input, " Wan Ahnaf Updated ");
  expect(screen.getByLabelText("Full Name")).toBe(input);
  fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() =>
    expect(mockShowSuccess).toHaveBeenCalledWith("Profile updated"),
  );
  expect(mockUpdateProfile).toHaveBeenCalledWith({
    full_name: "Wan Ahnaf Updated",
    username: "wan",
  });
});

it("keeps failed edits open, reports the error, and allows retry", async () => {
  mockUpdateProfile.mockResolvedValueOnce({ error: "Username already taken" });
  render(<ProfileScreen />);
  fireEvent.press(screen.getByText("Edit Profile"));
  fireEvent.changeText(screen.getByLabelText("Username"), "taken");
  fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() =>
    expect(mockShowError).toHaveBeenCalledWith("Couldn't update profile", {
      message: "Username already taken",
    }),
  );
  expect(mockShowSuccess).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Username").props.value).toBe("taken");
  fireEvent.changeText(screen.getByLabelText("Username"), "available");
  fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());
});

it("opens Settings from its deep link and preserves theme and sign-out actions", () => {
  mockTab = "Settings";
  render(<ProfileScreen />);
  expect(screen.getByText("Account Information")).toBeTruthy();
  fireEvent.press(screen.getByText("Dark"));
  expect(mockSetThemeMode).toHaveBeenCalledWith("dark");
  fireEvent.press(screen.getByText("Sign Out"));
  expect(mockSignOut).toHaveBeenCalledWith({ confirm: true });
  fireEvent.press(screen.getByLabelText("Profile"));
  expect(router.setParams).toHaveBeenCalledWith({ tab: "Profile" });
  expect(screen.getByText("Avatar:Wan Ahnaf")).toBeTruthy();
  fireEvent.press(screen.getByText("Delete account"));
  expect(router.push).toHaveBeenCalledWith("/account/delete");
});

it("keeps the mobile edit modal and existing tabs", () => {
  mockLayout.isMobile = true;
  render(<ProfileScreen />);
  fireEvent.press(screen.getByText("Edit Profile"));
  expect(screen.getByLabelText("Profile tab")).toBeTruthy();
  expect(screen.getByLabelText("Full Name")).toBeTruthy();
  expect(screen.getByText("Save Changes")).toBeTruthy();
});

it.each([false, true])(
  "uses accessible mobile tabs and edit controls on web=%s",
  async (isWeb) => {
    mockLayout.isMobile = true;
    mockLayout.isWeb = isWeb;
    render(<ProfileScreen />);
    const settings = screen.getByRole("tab", { name: "Settings tab" });
    expect(
      StyleSheet.flatten(settings.props.style).minHeight,
    ).toBeGreaterThanOrEqual(48);
    fireEvent.press(settings);
    expect(router.setParams).toHaveBeenCalledWith({ tab: "Settings" });
    expect(screen.queryByText("Edit Profile")).toBeNull();
    const edit = screen.getByRole("button", {
      name: "Edit account information",
    });
    expect(
      StyleSheet.flatten(edit.props.style).minHeight,
    ).toBeGreaterThanOrEqual(48);
    fireEvent.press(edit);
    const username = screen.getByLabelText("Username");
    expect(username.props.autoCapitalize).toBe("none");
    fireEvent.changeText(username, " changed ");
    fireEvent.press(screen.getByText("Save Changes"));
    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: "Wan Ahnaf",
        username: "changed",
      }),
    );
  },
);

it("keeps a failed mobile draft and resets it after Cancel", async () => {
  mockLayout.isMobile = true;
  mockUpdateProfile.mockResolvedValueOnce({ error: "Taken" });
  render(<ProfileScreen />);
  fireEvent.press(screen.getByText("Edit Profile"));
  fireEvent.changeText(screen.getByLabelText("Username"), "taken");
  fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() => expect(mockShowError).toHaveBeenCalled());
  expect(screen.getByLabelText("Username").props.value).toBe("taken");
  fireEvent.press(screen.getByText("Cancel"));
  fireEvent.press(screen.getByText("Edit Profile"));
  expect(screen.getByLabelText("Username").props.value).toBe("wan");
});

it("blocks duplicate saves and cancellation while the mobile edit is saving", async () => {
  mockLayout.isMobile = true;
  let resolve!: (value: any) => void;
  mockUpdateProfile.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(<ProfileScreen />);
  fireEvent.press(screen.getByText("Edit Profile"));
  const save = screen.getByRole("button", { name: "Save Changes" });
  act(() => {
    fireEvent.press(save);
    fireEvent.press(save);
  });
  expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  expect(screen.getByLabelText("Username").props.editable).toBe(false);
  await act(async () => resolve({ error: null }));
  expect(mockShowSuccess).toHaveBeenCalledTimes(1);
});

it("exposes selected theme state and keeps profile counts informational", () => {
  mockLayout.isMobile = true;
  render(<ProfileScreen />);
  expect(screen.queryByRole("button", { name: /Total Logs/ })).toBeNull();
  fireEvent.press(screen.getByRole("tab", { name: "Settings tab" }));
  expect(
    screen.getByRole("button", { name: "System theme", selected: true }),
  ).toBeTruthy();
});

it.each(["Upload avatar", "Delete avatar"])(
  "refreshes shared account identity after %s",
  async (action) => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByText(action));
    await waitFor(() => expect(mockRefreshProfile).toHaveBeenCalledTimes(1));
  },
);

it.each([
  [true, false],
  [true, true],
  [false, true],
])(
  "shows Notifications quick navigation only on compact layouts: web=%s mobile=%s",
  (isWeb, isMobile) => {
    mockLayout.isWeb = isWeb;
    mockLayout.isMobile = isMobile;
    render(<ProfileScreen />);
    const action = screen.queryByRole("button", { name: "Notifications" });
    if (!isWeb || isMobile) {
      expect(action).toBeTruthy();
      fireEvent.press(action!);
      expect(router.push).toHaveBeenCalledWith("/notifications");
    } else expect(action).toBeNull();
  },
);
