import React from "react";
import { Button, Text } from "react-native";
import { Stack, router } from "expo-router";
import {
  renderRouter,
  screen,
  fireEvent,
  waitFor,
} from "expo-router/testing-library";
import GroupsLayout from "@/app/groups/_layout";
import Groups from "@/app/groups";
import GroupDetail from "@/app/groups/[id]";
import CreateGroup from "@/app/groups/create";
import Invite from "@/app/groups/[id]/invite";

jest.unmock("expo-router");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({
    isWeb: false,
    isMobile: true,
    isDesktop: false,
  }),
}));
jest.mock("@/components/layout/DashboardWebLayout", () => ({
  DashboardWebLayout: ({ children }: any) => <>{children}</>,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
jest.mock("@/hooks/useToast", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
  useToast: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: jest.fn(async () => false) }),
}));
jest.mock("posthog-react-native", () => ({ usePostHog: () => null }));
const mockGroup = {
  id: "one",
  name: "Family",
  description: "Family vehicles",
  owner_id: "owner",
  member_count: 1,
  group_members: [],
};
jest.mock("@/lib/services/groupService", () => ({
  GroupService: {
    getGroups: jest.fn(async () => ({ data: [mockGroup], error: null })),
    getGroupById: jest.fn(async () => ({ data: mockGroup, error: null })),
    createGroup: jest.fn(async () => ({ error: null })),
  },
  GroupInvitationService: {
    getInvitations: jest.fn(async () => ({ data: [], error: null })),
    sendInvitation: jest.fn(async () => ({ error: null })),
  },
}));
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: {
    getVehiclesForGroup: jest.fn(async () => ({ data: [], error: null })),
  },
}));
function Profile() {
  return (
    <>
      <Text>Profile entry</Text>
      <Button title="Open Groups" onPress={() => router.push("/groups")} />
    </>
  );
}
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  profile: Profile,
  "groups/_layout": GroupsLayout,
  "groups/index": Groups,
  "groups/create": CreateGroup,
  "groups/[id]": GroupDetail,
  "groups/[id]/invite": Invite,
};
afterEach(() => jest.useRealTimers());
it("keeps the actual Profile → Groups → group → Invite return path and group id", async () => {
  const result = renderRouter(routes, { initialUrl: "/profile" });
  fireEvent.press(screen.getByText("Open Groups"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Open Family" })).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole("button", { name: "Open Family" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups/one"));
  fireEvent.press(screen.getByRole("button", { name: "Invite Members" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups/one/invite"));
  fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups/one"));
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups"));
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/profile"));
});
it("returns a successfully created group form to the preceding Groups list", async () => {
  const result = renderRouter(routes, { initialUrl: "/groups" });
  fireEvent.press(screen.getByRole("button", { name: "Create Group" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups/create"));
  fireEvent.changeText(screen.getByLabelText("Group Name"), "Family");
  fireEvent.press(screen.getByRole("button", { name: "Create Group" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups"));
});
it("uses the matching group as the fallback for a directly opened invitation form", async () => {
  const result = renderRouter(routes, { initialUrl: "/groups/one/invite" });
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/groups/one"));
});
