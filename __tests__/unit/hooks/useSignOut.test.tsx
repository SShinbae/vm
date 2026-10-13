import { act, renderHook } from "@testing-library/react-native";

const mockAuthSignOut = jest.fn();
const mockConfirm = jest.fn();
const mockShowError = jest.fn();
const mockReplace = jest.fn();

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ signOut: mockAuthSignOut }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ showError: mockShowError }),
}));
jest.mock("expo-router", () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
}));

import { useSignOut } from "@/hooks/useSignOut";

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthSignOut.mockResolvedValue({ error: null });
  mockConfirm.mockResolvedValue(true);
});

describe("useSignOut", () => {
  it("does not sign out when the confirm is cancelled", async () => {
    mockConfirm.mockResolvedValue(false);
    const { result } = renderHook(() => useSignOut());
    await act(() => result.current.signOut({ confirm: true }));
    expect(mockAuthSignOut).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("signs out and redirects to login on success", async () => {
    const { result } = renderHook(() => useSignOut());
    await act(() => result.current.signOut({ confirm: true }));
    expect(mockAuthSignOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("does not navigate when redirectTo is null", async () => {
    const { result } = renderHook(() => useSignOut({ redirectTo: null }));
    await act(() => result.current.signOut());
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows a toast on error and releases the guard", async () => {
    mockAuthSignOut.mockResolvedValueOnce({ error: "offline" });
    const { result } = renderHook(() => useSignOut());
    await act(() => result.current.signOut());
    expect(mockShowError).toHaveBeenCalledWith("Couldn't sign you out", {
      message: "Check your connection and try again.",
    });
    expect(result.current.signingOut).toBe(false);
    expect(mockReplace).not.toHaveBeenCalled();
    await act(() => result.current.signOut());
    expect(mockAuthSignOut).toHaveBeenCalledTimes(2);
  });

  it("runs signOut once for two simultaneous calls", async () => {
    let release!: (v: { error: null }) => void;
    mockAuthSignOut.mockReturnValueOnce(new Promise((r) => (release = r)));
    const { result } = renderHook(() => useSignOut());
    await act(async () => {
      const a = result.current.signOut();
      const b = result.current.signOut();
      release({ error: null });
      await Promise.all([a, b]);
    });
    expect(mockAuthSignOut).toHaveBeenCalledTimes(1);
  });
});
