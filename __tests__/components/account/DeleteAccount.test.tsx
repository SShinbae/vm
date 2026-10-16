import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

const mockSchedule = jest.fn();
const mockSignOutLocal = jest.fn().mockResolvedValue({ error: null });
const mockReplace = jest.fn();
const mockConfirm = jest.fn();
const mockAlert = jest.fn();
const mockShowError = jest.fn();
const mockFocus = { current: (() => {}) as () => void };
const mockOwned = { current: [] as { id: string; name: string }[] };

jest.mock("@/lib/services/accountDeletionService", () => ({
  AccountDeletionService: { schedule: () => mockSchedule() },
}));
jest.mock("@/services/supabaseClient", () => ({
  supabase: { auth: { signOut: (o: unknown) => mockSignOutLocal(o) } },
}));
const mockGroups = jest.fn();
jest.mock("@/lib/services/groupService", () => ({
  GroupService: {
    getOwnedGroupsWithMembers: () => mockGroups(),
  },
}));
jest.mock("expo-router", () => ({
  router: {
    replace: (...a: unknown[]) => mockReplace(...a),
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: () => false,
  },
  useFocusEffect: (cb: () => void) => {
    mockFocus.current = cb;
    require("react").useEffect(() => cb(), []);
  },
  useLocalSearchParams: () => ({}),
}));
jest.mock("@/components/ui/icon-symbol", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    IconSymbol: ({ name, color }: { name: string; color?: string }) =>
      React.createElement(Text, { testID: `icon-${name}`, style: { color } }),
  };
});
jest.mock("@/components/ui/ImageUpload", () => ({ ImageUpload: () => null }));
jest.mock("@/components/ui/Modal", () => ({ Modal: () => null }));
jest.mock("@/components/notifications/NotificationPreferencesForm", () => ({
  NotificationPreferencesForm: () => null,
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isMobile: true, isWeb: false }),
}));
jest.mock("@/hooks/useProfileStats", () => ({
  useProfileStats: () => ({
    stats: { activeGroups: 0, daysActive: 0, totalLogs: 0 },
    loading: false,
  }),
}));
jest.mock("@/lib/contexts/ThemeContext", () => ({
  useTheme: () => ({ themeMode: "system", setThemeMode: jest.fn() }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm, alert: mockAlert }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: (...a: unknown[]) => mockShowError(...a),
    showInfo: jest.fn(),
  }),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return {
    createStyleSheet: (factory: any) => factory,
    useStyles: () => ({ theme: lightTheme }),
  };
});

import { lightTheme, withOpacity } from "@/src/design-system";
import DeleteAccountScreen from "@/app/account/delete";
import ProfileScreen from "@/app/(tabs)/profile";

describe("Delete account screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOwned.current = [];
    mockGroups.mockImplementation(() =>
      Promise.resolve({ data: mockOwned.current, error: null }),
    );
    mockConfirm.mockResolvedValue(true);
    mockAlert.mockResolvedValue(undefined);
    mockSignOutLocal.mockResolvedValue({ error: null });
  });

  it("enables the button only for exactly DELETE", async () => {
    const { getByLabelText, getByText } = render(<DeleteAccountScreen />);
    const button = await waitFor(() => getByText("Delete my account"));
    fireEvent.press(button);
    expect(mockSchedule).not.toHaveBeenCalled();
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "delete");
    fireEvent.press(button);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("blocks while the user owns a group with members and links to it", async () => {
    mockOwned.current = [{ id: "g1", name: "Family Fleet" }];
    const { findByText, getByLabelText, getByText } = render(
      <DeleteAccountScreen />,
    );
    expect(await findByText("Family Fleet")).toBeTruthy();
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    fireEvent.press(getByText("Delete my account"));
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  const submit = async () => {
    const utils = render(<DeleteAccountScreen />);
    fireEvent.changeText(
      utils.getByLabelText("Type DELETE to confirm"),
      "DELETE",
    );
    fireEvent.press(await utils.findByText("Delete my account"));
  };
  const scheduled = {
    kind: "scheduled",
    scheduledFor: "2026-11-10T00:00:00.000Z",
  };

  it("asks for destructive confirmation and does nothing on cancel", async () => {
    mockConfirm.mockResolvedValue(false);
    await submit();
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Delete your account?",
        destructive: true,
        confirmText: "Delete account",
        cancelText: "Cancel",
      }),
    );
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(mockSignOutLocal).not.toHaveBeenCalled();
  });

  it("bolds the date in the confirm message and the screen copy", async () => {
    mockConfirm.mockResolvedValue(false);
    const { getByText, getByLabelText } = render(<DeleteAccountScreen />);
    expect(getByLabelText("Type DELETE to confirm")).toBeTruthy();
    expect(getByText("DELETE").props.style).toEqual(
      expect.objectContaining({ fontWeight: lightTheme.fontWeight.bold }),
    );
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    fireEvent.press(await waitFor(() => getByText("Delete my account")));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    const { message } = mockConfirm.mock.calls[0][0];
    const view = render(<Text>{message}</Text>);
    const date = view.getByText(/\d{4}$/);
    expect(date.props.style).toEqual(
      expect.objectContaining({
        fontWeight: lightTheme.fontWeight.bold,
        color: lightTheme.colors.text,
      }),
    );
  });

  it("on success alerts, then signs out locally, then leaves", async () => {
    mockSchedule.mockResolvedValue(scheduled);
    const order: string[] = [];
    mockAlert.mockImplementation(async () => void order.push("alert"));
    mockSignOutLocal.mockImplementation(async () => {
      order.push("signOut");
      return { error: null };
    });
    mockReplace.mockImplementation(() => order.push("replace"));
    await submit();
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockAlert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Account scheduled for deletion" }),
    );
    expect(mockSignOutLocal).toHaveBeenCalledWith({ scope: "local" });
    expect(order).toEqual(["alert", "signOut", "replace"]);
  });

  it("shows an error and stays put when local sign-out fails", async () => {
    mockSchedule.mockResolvedValue(scheduled);
    mockSignOutLocal.mockResolvedValue({ error: new Error("400") });
    await submit();
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith("Couldn't sign you out", {
        message: "Close and reopen the app to finish signing out.",
      }),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("on REAUTH asks to sign in again and routes to login with next", async () => {
    mockSchedule.mockResolvedValue({ kind: "reauth" });
    mockConfirm.mockResolvedValue(true);
    const { getByLabelText, findByText } = render(<DeleteAccountScreen />);
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    fireEvent.press(await findByText("Delete my account"));
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/(auth)/login?next=/account/delete",
      ),
    );
    expect(mockSignOutLocal).toHaveBeenCalledWith({ scope: "local" });
  });

  it("reloads the blockers on refocus so a handed-over group unblocks delete", async () => {
    mockOwned.current = [{ id: "g1", name: "Family Fleet" }];
    mockSchedule.mockResolvedValue({
      kind: "scheduled",
      scheduledFor: "2026-11-10T00:00:00.000Z",
    });
    const { findByText, queryByText, getByLabelText, getByText } = render(
      <DeleteAccountScreen />,
    );
    expect(await findByText("Family Fleet")).toBeTruthy();
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    fireEvent.press(getByText("Delete my account"));
    expect(mockSchedule).not.toHaveBeenCalled();

    mockOwned.current = [];
    await act(async () => {
      mockFocus.current();
    });
    await waitFor(() => expect(queryByText("Family Fleet")).toBeNull());
    fireEvent.press(getByText("Delete my account"));
    await waitFor(() => expect(mockSchedule).toHaveBeenCalled());
  });

  it("disables the delete button until the group check resolves", async () => {
    let resolveGroups: (v: unknown) => void = () => {};
    mockGroups.mockImplementationOnce(
      () => new Promise((r) => (resolveGroups = r)),
    );
    const { getByLabelText, getByRole, getByText, queryByText } = render(
      <DeleteAccountScreen />,
    );
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    expect(getByText("Checking your groups…")).toBeTruthy();
    expect(getByRole("button", { name: "Delete my account" })).toBeDisabled();

    await act(async () => {
      resolveGroups({ data: [], error: null });
    });
    expect(queryByText("Checking your groups…")).toBeNull();
    expect(
      getByRole("button", { name: "Delete my account" }),
    ).not.toBeDisabled();
  });

  it("shows a group-check error and keeps the delete button enabled", async () => {
    mockGroups.mockResolvedValue({ data: null, error: "network down" });
    const { findByText, getByLabelText, getByRole } = render(
      <DeleteAccountScreen />,
    );
    expect(
      await findByText("Couldn't check your groups. Go back and try again."),
    ).toBeTruthy();
    expect(getByRole("alert")).toBeTruthy();
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    const button = getByRole("button", { name: "Delete my account" });
    expect(button).not.toBeDisabled();
    fireEvent.press(button);
    await waitFor(() => expect(mockSchedule).toHaveBeenCalled());
  });
});

describe("Profile delete account row", () => {
  const backgroundOf = (node: any) => {
    let n = node.parent;
    while (n && !n.props.style?.backgroundColor) n = n.parent;
    return n?.props.style?.backgroundColor;
  };

  it("uses the error colour for the Delete account row only", () => {
    const { getByText, getByTestId } = render(<ProfileScreen />);
    const { error, primary, text } = lightTheme.colors;

    expect(getByText("Delete account").props.style).toEqual(
      expect.objectContaining({ color: error }),
    );
    expect(getByTestId("icon-trash").props.style).toEqual(
      expect.objectContaining({ color: error }),
    );
    expect(backgroundOf(getByTestId("icon-trash"))).toEqual(
      withOpacity(error, 0.08),
    );

    expect(getByText("Edit Profile").props.style).toEqual(
      expect.objectContaining({ color: text }),
    );
    expect(getByTestId("icon-pencil").props.style).toEqual(
      expect.objectContaining({ color: primary }),
    );
    expect(backgroundOf(getByTestId("icon-pencil"))).toEqual(
      withOpacity(primary, 0.08),
    );
  });
});
