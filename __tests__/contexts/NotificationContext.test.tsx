import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  NotificationProvider,
  useNotifications,
} from "@/lib/contexts/NotificationContext";

const mockRefetch = jest.fn();
const mockMutate = jest.fn();
const mockMarkAll = jest.fn();
const mockToast = jest.fn();
let mockQuery = {
  data: [],
  isLoading: true,
  isFetching: true,
  error: null as Error | null,
  refetch: mockRefetch,
};
jest.mock("@/hooks/useNotificationQueries", () => ({
  useNotifications: () => mockQuery,
  useMarkNotificationAsRead: () => ({ mutate: mockMutate }),
  useMarkAllNotificationsAsRead: () => ({ mutate: mockMarkAll }),
  useDeleteNotification: () => ({ mutate: jest.fn() }),
  useDeleteAllNotifications: () => ({ mutate: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => {
  const client = { clear: jest.fn(), setQueryData: jest.fn() };
  return {
    ...jest.requireActual("@tanstack/react-query"),
    useQueryClient: () => client,
  };
});
jest.mock("@/services/supabaseClient", () => {
  const channel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  };
  return {
    supabase: {
      channel: () => channel,
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: "user-1" } } })),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        }),
      },
    },
  };
});
jest.mock("@/lib/utils/notificationMigration", () => ({
  hasMigratedNotifications: async () => true,
  migrateNotificationsFromStorage: jest.fn(),
}));
jest.mock("@/lib/services/notificationPreferencesService", () => ({
  migratePreferencesFromAsyncStorage: jest.fn(),
}));
jest.mock("@/hooks/useToast", () => ({
  toast: { error: (...args: any[]) => mockToast(...args) },
}));
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);
beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {
    data: [],
    isLoading: true,
    isFetching: true,
    error: null,
    refetch: mockRefetch,
  };
});

it("reports query loading and errors independently of initialization", async () => {
  const { result, rerender } = renderHook(useNotifications, { wrapper });
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(result.current.isLoading).toBe(true);
  mockQuery = {
    ...mockQuery,
    isLoading: false,
    isFetching: false,
    error: new Error("Offline"),
  };
  rerender({});
  expect(result.current.error).toEqual(new Error("Offline"));
  expect(result.current.isLoading).toBe(false);
});

it("asks React Query to reject refresh failures", async () => {
  mockRefetch.mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(useNotifications, { wrapper });
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  await expect(result.current.refreshNotifications()).rejects.toThrow(
    "Offline",
  );
  expect(mockRefetch).toHaveBeenCalledWith({ throwOnError: true });
});

it("guards simultaneous read actions and reports save failures", async () => {
  const { result } = renderHook(useNotifications, { wrapper });
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  act(() => {
    result.current.markAsRead("n1");
    result.current.markAsRead("n1");
    result.current.markAllAsRead();
  });
  expect(mockMutate).toHaveBeenCalledTimes(1);
  expect(mockMarkAll).not.toHaveBeenCalled();
  expect(result.current.isMarkingRead).toBe(true);
  const callbacks = mockMutate.mock.calls[0][1];
  act(() => {
    callbacks.onError(new Error("Offline"));
    callbacks.onSettled();
  });
  expect(mockToast).toHaveBeenCalledWith("Couldn't mark notification as read");
  expect(result.current.isMarkingRead).toBe(false);
  act(() => {
    result.current.markAllAsRead();
    result.current.markAllAsRead();
  });
  expect(mockMarkAll).toHaveBeenCalledTimes(1);
  act(() => {
    mockMarkAll.mock.calls[0][1].onError(new Error("Offline"));
    mockMarkAll.mock.calls[0][1].onSettled();
  });
  expect(mockToast).toHaveBeenCalledWith(
    "Couldn't mark all notifications as read",
  );
  expect(result.current.isMarkingRead).toBe(false);
});
