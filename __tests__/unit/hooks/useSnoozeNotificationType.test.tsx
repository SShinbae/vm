import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSnoozeNotificationType } from "@/hooks/useNotificationPreferences";
import {
  getPreferences,
  upsertPreferences,
} from "@/lib/services/notificationPreferencesService";
jest.mock("@/lib/services/notificationPreferencesService", () => ({
  getPreferences: jest.fn(),
  upsertPreferences: jest.fn(),
}));
const input = {
  userId: "one",
  notificationType: "fuel_log",
  snoozedUntil: "2026-10-17T00:00:00.000Z",
};
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return renderHook(() => useSnoozeNotificationType(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(upsertPreferences)
    .mockResolvedValue({ data: {}, error: null } as any);
});
it("does not overwrite other snoozed types when reading preferences fails", async () => {
  jest
    .mocked(getPreferences)
    .mockResolvedValueOnce({ data: null, error: "Offline" } as any);
  const { result } = setup();
  await act(async () => {
    await expect(result.current.mutateAsync(input)).rejects.toThrow("Offline");
  });
  expect(upsertPreferences).not.toHaveBeenCalled();
});
it("preserves existing snoozes when saving a new type", async () => {
  jest.mocked(getPreferences).mockResolvedValueOnce({
    data: { snoozed_types: { service_log: "2026-10-20T00:00:00.000Z" } },
    error: null,
  } as any);
  const { result } = setup();
  await act(async () => {
    await result.current.mutateAsync(input);
  });
  expect(upsertPreferences).toHaveBeenCalledWith("one", {
    snoozed_types: {
      service_log: "2026-10-20T00:00:00.000Z",
      fuel_log: input.snoozedUntil,
    },
  });
});
