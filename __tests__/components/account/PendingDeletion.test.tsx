import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockCancel = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockSyncUser = jest.fn();

jest.mock("@/lib/services/pushService", () => ({
  pushService: { syncUser: () => mockSyncUser() },
}));

jest.mock("@/lib/services/accountDeletionService", () => ({
  AccountDeletionService: { cancel: () => mockCancel() },
}));
jest.mock("expo-router", () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ showSuccess: mockShowSuccess, showError: mockShowError }),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { profile: { deletion_scheduled_at: "2026-11-10T00:00:00Z" } },
    signOut: jest.fn().mockResolvedValue({ error: null }),
    refreshProfile: () => mockRefresh(),
  }),
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

import PendingScreen from "@/app/account-pending-deletion";

describe("Pending deletion screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
  });

  it("cancel refreshes the profile before navigating to the tabs", async () => {
    mockCancel.mockResolvedValue({ kind: "cancelled" });
    const { getByText } = render(<PendingScreen />);
    fireEvent.press(getByText("Cancel deletion"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)"));
    expect(mockRefresh.mock.invocationCallOrder[0]).toBeLessThan(
      mockReplace.mock.invocationCallOrder[0],
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Deletion cancelled",
      expect.anything(),
    );
    expect(mockSyncUser).toHaveBeenCalledTimes(1);
    expect(mockSyncUser.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockRefresh.mock.invocationCallOrder[0],
    );
  });

  it("not_pending also re-registers push", async () => {
    mockCancel.mockResolvedValue({ kind: "not_pending" });
    const { getByText } = render(<PendingScreen />);
    fireEvent.press(getByText("Cancel deletion"));
    await waitFor(() => expect(mockSyncUser).toHaveBeenCalledTimes(1));
  });

  it("in_progress shows a clear message and does not navigate", async () => {
    mockCancel.mockResolvedValue({ kind: "in_progress" });
    const { getByText } = render(<PendingScreen />);
    fireEvent.press(getByText("Cancel deletion"));
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        "Your account is being deleted",
        expect.anything(),
      ),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("rejected refresh still toasts cancelled, warns, and does not navigate", async () => {
    mockCancel.mockResolvedValue({ kind: "cancelled" });
    mockRefresh.mockRejectedValue(new Error("offline"));
    const { getByText } = render(<PendingScreen />);
    fireEvent.press(getByText("Cancel deletion"));
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        "Couldn't refresh your account",
        {
          message: "Tap Cancel deletion again, or reopen the app.",
        },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Deletion cancelled",
      expect.anything(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSyncUser).not.toHaveBeenCalled();
  });
});
