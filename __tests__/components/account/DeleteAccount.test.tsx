import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

const mockSchedule = jest.fn();
const mockSignOutLocal = jest.fn().mockResolvedValue({ error: null });
const mockReplace = jest.fn();
const mockConfirm = jest.fn();
const mockFocus = { current: (() => {}) as () => void };
const mockOwned = { current: [] as { id: string; name: string }[] };

jest.mock("@/lib/services/accountDeletionService", () => ({
  AccountDeletionService: { schedule: () => mockSchedule() },
}));
jest.mock("@/services/supabaseClient", () => ({
  supabase: { auth: { signOut: (o: unknown) => mockSignOutLocal(o) } },
}));
jest.mock("@/lib/services/groupService", () => ({
  GroupService: {
    getOwnedGroupsWithMembers: () =>
      Promise.resolve({ data: mockOwned.current, error: null }),
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
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
  }),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

import DeleteAccountScreen from "@/app/account/delete";

describe("Delete account screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOwned.current = [];
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

  it("on success signs out locally and leaves the app", async () => {
    mockSchedule.mockResolvedValue({
      kind: "scheduled",
      scheduledFor: "2026-11-10T00:00:00.000Z",
    });
    const { getByLabelText, findByText } = render(<DeleteAccountScreen />);
    fireEvent.changeText(getByLabelText("Type DELETE to confirm"), "DELETE");
    fireEvent.press(await findByText("Delete my account"));
    await waitFor(() =>
      expect(mockSignOutLocal).toHaveBeenCalledWith({ scope: "local" }),
    );
    expect(mockReplace).toHaveBeenCalled();
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
});
