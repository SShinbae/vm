import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SnoozeMenu } from "@/components/notifications/SnoozeMenu";
const mockSave = jest.fn();
const mockRead = jest.fn();
const mockClose = jest.fn();
const mockSchedule = jest.fn(async (_params: any) => null);
let mockUserId = "one";
let mockModalProps: any;
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: mockUserId } }),
}));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({ markAsRead: mockRead }),
}));
jest.mock("@/hooks/useNotificationPreferences", () => ({
  useSnoozeNotificationType: () => ({ mutateAsync: mockSave }),
}));
jest.mock("@/lib/services/localNotificationService", () => ({
  scheduleSnooze: (params: any) => mockSchedule(params),
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: false, isMobile: true }),
}));
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/Modal", () => ({
  Modal: (props: any) => {
    mockModalProps = props;
    return props.visible ? <>{props.children}</> : null;
  },
}));
const menu = () => (
  <SnoozeMenu
    notificationId="n"
    notificationType="fuel_log"
    title="Fuel"
    body="Message"
    onClose={mockClose}
  />
);
beforeEach(() => {
  jest.clearAllMocks();
  mockUserId = "one";
  mockSave.mockResolvedValue({});
});
it.each([
  ["1 day", 1],
  ["3 days", 3],
  ["1 week", 7],
])("saves %s before scheduling, reading and closing", async (label, days) => {
  render(menu());
  fireEvent.press(screen.getByRole("button", { name: `Snooze for ${label}` }));
  await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1));
  const args = mockSave.mock.calls[0][0];
  expect(args).toEqual(
    expect.objectContaining({ userId: "one", notificationType: "fuel_log" }),
  );
  const interval = new Date(args.snoozedUntil).getTime() - Date.now();
  expect(Math.round(interval / 86400000)).toBe(days);
  expect(mockSave.mock.invocationCallOrder[0]).toBeLessThan(
    mockSchedule.mock.invocationCallOrder[0],
  );
  expect(mockSchedule.mock.invocationCallOrder[0]).toBeLessThan(
    mockRead.mock.invocationCallOrder[0],
  );
  expect(mockRead).toHaveBeenCalledWith("n");
});
it("blocks duplicate submits and dismissal until a pending save finishes", async () => {
  let resolve!: (value: any) => void;
  mockSave.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(menu());
  const option = screen.getByRole("button", { name: "Snooze for 1 day" });
  act(() => {
    fireEvent.press(option);
    fireEvent.press(option);
  });
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockRead).not.toHaveBeenCalled();
  expect(mockModalProps.closeOnBackdrop).toBe(false);
  act(() => mockModalProps.onClose());
  expect(mockClose).not.toHaveBeenCalled();
  await act(async () => resolve({}));
  expect(mockClose).toHaveBeenCalledTimes(1);
});
it("keeps a failed snooze open for retry without marking it read", async () => {
  mockSave.mockRejectedValueOnce(new Error("Offline"));
  render(menu());
  fireEvent.press(screen.getByRole("button", { name: "Snooze for 1 day" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(mockRead).not.toHaveBeenCalled();
  expect(mockClose).not.toHaveBeenCalled();
  expect(mockSchedule).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Snooze for 1 day" }));
  await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1));
});
it("ignores a late save after the account changes", async () => {
  let resolve!: (value: any) => void;
  mockSave.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(menu());
  fireEvent.press(screen.getByRole("button", { name: "Snooze for 1 day" }));
  mockUserId = "two";
  view.rerender(menu());
  await act(async () => resolve({}));
  expect(mockSchedule).not.toHaveBeenCalled();
  expect(mockRead).not.toHaveBeenCalled();
});

it("does not schedule or mark read after the menu unmounts", async () => {
  let resolve!: (value: any) => void;
  mockSave.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(menu());
  fireEvent.press(screen.getByRole("button", { name: "Snooze for 1 day" }));
  view.unmount();
  await act(async () => resolve({}));
  expect(mockRead).not.toHaveBeenCalled();
  expect(mockSchedule).not.toHaveBeenCalled();
  expect(mockClose).not.toHaveBeenCalled();
});
