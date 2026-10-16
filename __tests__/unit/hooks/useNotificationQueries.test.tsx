import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/useNotificationQueries";
import { queryKeys } from "@/lib/config/queryClient";
import { supabase } from "@/services/supabaseClient";

jest.mock("@/services/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

it.each(["one", "all"])(
  "rolls back optimistic %s read changes when saving fails",
  async (mode) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    const key = queryKeys.notifications.list("user-1");
    const notifications = [
      { id: "n1", read: false },
      { id: "n2", read: false },
    ];
    client.setQueryData(key, notifications);
    let finish: (result: any) => void = () => {};
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    const builder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: pending.then.bind(pending),
    };
    jest.mocked(supabase.from).mockReturnValue(builder as any);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () => {
        const one = useMarkNotificationAsRead();
        const all = useMarkAllNotificationsAsRead();
        return mode === "one" ? one : all;
      },
      { wrapper },
    );
    let mutation: Promise<unknown>;
    act(() => {
      mutation = result.current
        .mutateAsync(mode === "one" ? "n1" : "user-1")
        .catch(() => {});
    });
    await waitFor(() =>
      expect(client.getQueryData(key)).toEqual([
        { id: "n1", read: true },
        { id: "n2", read: mode === "all" },
      ]),
    );
    await act(async () => {
      finish({ error: new Error("Offline") });
      await mutation;
    });
    expect(client.getQueryData(key)).toEqual(notifications);
    consoleError.mockRestore();
    unmount();
    client.clear();
  },
);
