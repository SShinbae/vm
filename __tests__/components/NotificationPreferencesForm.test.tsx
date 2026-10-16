import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { notificationPreferencesDefaultValues } from "@/src/shared/schemas/notificationPreferencesSchema";

const mockUpdatePrefs = jest.fn();
const mockShowError = jest.fn();
let mockPreferencesError = false;
const mockRefetchPreferences = jest.fn();
jest.mock("@/hooks/useNotificationPreferences", () => ({
  useNotificationPreferences: () => ({
    data: null,
    isLoading: false,
    isError: mockPreferencesError,
    refetch: mockRefetchPreferences,
  }),
  useUpdateNotificationPreferences: () => ({ mutateAsync: mockUpdatePrefs }),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ showError: mockShowError }),
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: true, isMobile: false }),
}));
jest.mock("@/lib/services/pushService", () => ({
  pushService: {
    isSupported: false,
    hasPermission: jest.fn(async () => false),
  },
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));

beforeEach(() => {
  mockPreferencesError = false;
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockUpdatePrefs.mockResolvedValue({});
});
it("offers Retry when preferences fail instead of rendering editable defaults", () => {
  mockPreferencesError = true;
  render(<NotificationPreferencesForm />);
  expect(screen.queryByLabelText("Log Updates")).toBeNull();
  fireEvent.press(screen.getByText("Retry notification preferences"));
  expect(mockRefetchPreferences).toHaveBeenCalled();
});
afterEach(() => jest.useRealTimers());

async function flush() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
}

it("combines changes across fields and keeps the text input mounted", async () => {
  render(<NotificationPreferencesForm />);
  const input = screen.getByLabelText("Monthly spending threshold");
  fireEvent.changeText(input, "120");
  fireEvent.press(screen.getByText("1 day"));
  expect(screen.getByLabelText("Monthly spending threshold")).toBe(input);
  expect(screen.getByLabelText("Monthly spending threshold").props.value).toBe(
    "120",
  );
  await flush();
  expect(mockUpdatePrefs).toHaveBeenCalledWith({
    userId: "user-1",
    data: {
      monthly_spending_threshold: 120,
      service_reminder_days: [
        ...notificationPreferencesDefaultValues.service_reminder_days,
        1,
      ],
    },
  });
});

it("includes pending changes when an immediate switch is saved", async () => {
  render(<NotificationPreferencesForm />);
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "200",
  );
  fireEvent(screen.getByLabelText("Log Updates"), "valueChange", false);
  await act(async () => {});
  expect(mockUpdatePrefs).toHaveBeenCalledWith({
    userId: "user-1",
    data: { monthly_spending_threshold: 200, log_updates_enabled: false },
  });
});

it("flushes pending edits when leaving Settings", async () => {
  const view = render(<NotificationPreferencesForm />);
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "300",
  );
  view.unmount();
  await act(async () => {});
  expect(mockUpdatePrefs).toHaveBeenCalledWith({
    userId: "user-1",
    data: { monthly_spending_threshold: 300 },
  });
});

it("reports failed saves and continues saving later changes", async () => {
  mockUpdatePrefs.mockRejectedValueOnce(new Error("Offline"));
  render(<NotificationPreferencesForm />);
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "400",
  );
  await flush();
  expect(mockShowError).toHaveBeenCalledWith(
    "Couldn't save notification preferences",
  );
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "500",
  );
  await flush();
  expect(mockUpdatePrefs).toHaveBeenLastCalledWith({
    userId: "user-1",
    data: { monthly_spending_threshold: 500 },
  });
});

it("allows decimal amounts to be entered without stripping the decimal point", async () => {
  render(<NotificationPreferencesForm />);
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "12.",
  );
  expect(screen.getByLabelText("Monthly spending threshold").props.value).toBe(
    "12.",
  );
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "12.50",
  );
  await flush();
  expect(mockUpdatePrefs).toHaveBeenCalledWith({
    userId: "user-1",
    data: { monthly_spending_threshold: 12.5 },
  });
});

it("finishes older saves before sending newer values", async () => {
  let finishFirst!: (value: object) => void;
  mockUpdatePrefs.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
  );
  render(<NotificationPreferencesForm />);
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "100",
  );
  await flush();
  fireEvent.changeText(
    screen.getByLabelText("Monthly spending threshold"),
    "200",
  );
  await flush();
  expect(mockUpdatePrefs).toHaveBeenCalledTimes(1);
  await act(async () => {
    finishFirst({});
  });
  expect(mockUpdatePrefs).toHaveBeenCalledTimes(2);
  expect(mockUpdatePrefs).toHaveBeenLastCalledWith({
    userId: "user-1",
    data: { monthly_spending_threshold: 200 },
  });
});
