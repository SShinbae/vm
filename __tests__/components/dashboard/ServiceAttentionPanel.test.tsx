import { ServiceAttentionPanel } from "@/components/dashboard/ServiceAttentionPanel";
import { ServiceReminder } from "@/lib/dashboard/serviceReminders";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: () => ({}),
  useStyles: () => ({
    styles: {},
    theme: {
      colors: {
        primary: "blue",
        text: "black",
        textSecondary: "gray",
        warning: "orange",
        error: "red",
        surface: "white",
        border: "gray",
      },
    },
  }),
}));

const reminder = (id: string): ServiceReminder => ({
  logId: id,
  vehicleName: `Vehicle ${id}`,
  serviceType: "oil_change",
  dueDate: "2026-10-20",
  dueMileage: null,
  daysUntilDue: 7,
  kmUntilDue: null,
  status: "due_soon",
});

describe("ServiceAttentionPanel", () => {
  beforeEach(() => mockPush.mockClear());

  it("shows three reminders, expands the rest, and opens the selected log", () => {
    render(
      <ServiceAttentionPanel reminders={["1", "2", "3", "4"].map(reminder)} />,
    );

    expect(screen.getByText("Vehicle 1")).toBeTruthy();
    expect(screen.queryByText("Vehicle 4")).toBeNull();
    fireEvent.press(screen.getByText("Show 1 more"));
    fireEvent.press(screen.getByText("Vehicle 4"));

    expect(mockPush).toHaveBeenCalledWith("/logs/service/4");
  });

  it("renders nothing while there are no reminders, including a failed fetch", () => {
    render(<ServiceAttentionPanel reminders={[]} />);

    expect(screen.queryByText("Needs attention")).toBeNull();
    expect(screen.queryByText("YOUR GARAGE")).toBeNull();
  });
});
