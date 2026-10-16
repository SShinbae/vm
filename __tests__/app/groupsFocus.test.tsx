import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import GroupsScreen from "@/app/groups";
import GroupDetailScreen from "@/app/groups/[id]";
import CreateGroupScreen from "@/app/groups/create";
import InviteToGroupScreen from "@/app/groups/[id]/invite";
import { GroupAvatar } from "@/components/groups/GroupAvatar";
import { router } from "expo-router";
import {
  GroupService,
  GroupInvitationService,
} from "@/lib/services/groupService";
import { VehicleService } from "@/lib/services/vehicleService";

let mockFocusCallback: (() => void | (() => void)) | undefined;
let mockFocusCleanup: (() => void) | undefined;
const mockNavigation = { canGoBack: () => true, back: jest.fn() };
const mockLayout = {
  isWeb: false,
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isLargeDesktop: false,
};
const mockConfirm = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useRouter: () => mockNavigation,
    useLocalSearchParams: () => ({ id: "group-1" }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      mockFocusCallback = callback;
      React.useEffect(() => {
        const cleanup = callback();
        mockFocusCleanup = typeof cleanup === "function" ? cleanup : undefined;
        return cleanup;
      }, [callback]);
    },
  };
});

jest.mock("@/lib/services/groupService", () => ({
  GroupService: {
    getGroups: jest.fn(),
    getGroupById: jest.fn(),
    createGroup: jest.fn(),
    removeMember: jest.fn(),
    transferOwnership: jest.fn(),
    leaveGroup: jest.fn(),
    deleteGroup: jest.fn(),
  },
  GroupInvitationService: {
    getInvitations: jest.fn(),
    sendInvitation: jest.fn(),
    resendInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
  },
}));
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: { getVehiclesForGroup: jest.fn() },
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner-1" } }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm }),
}));
jest.mock("@/hooks/useToast", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
  useToast: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));
jest.mock("posthog-react-native", () => ({ usePostHog: () => null }));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory: any) => {
    const theme = require("@/src/design-system").lightTheme;
    return {
      theme,
      styles: typeof factory === "function" ? factory(theme) : factory || {},
    };
  },
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
  };
});
jest.mock("expo-image", () => ({
  Image: (props: any) => {
    const { View } = require("react-native");
    return <View {...props} />;
  },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/Skeleton", () => ({
  SkeletonList: () => null,
  SkeletonGroupDetail: () => null,
}));
jest.mock("@/components/ui/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => {
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  },
}));
jest.mock("@/components/ui/ThemedText", () => ({
  ThemedText: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require("react-native");
    return <Text>{children}</Text>;
  },
}));

const group = (name: string) => ({
  id: "group-1",
  name,
  description: null,
  owner_id: "owner-1",
  member_count: 1,
  group_members: [],
});

const setFocus = async () => {
  act(() => mockFocusCleanup?.());
  await act(async () => {
    mockFocusCleanup = mockFocusCallback?.() || undefined;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLayout.isWeb = false;
  mockLayout.isMobile = true;
  mockLayout.isTablet = false;
  mockConfirm.mockResolvedValue(false);
  mockFocusCallback = undefined;
  mockFocusCleanup = undefined;
  (GroupService.getGroups as jest.Mock).mockResolvedValue({
    data: [],
    error: null,
  });
  (GroupService.getGroupById as jest.Mock).mockResolvedValue({
    data: group("Group"),
    error: null,
  });
  (GroupInvitationService.getInvitations as jest.Mock).mockResolvedValue({
    data: [],
    error: null,
  });
  (VehicleService.getVehiclesForGroup as jest.Mock).mockResolvedValue({
    data: [],
    error: null,
  });
});

const webLayout = () => {
  mockLayout.isWeb = true;
  mockLayout.isMobile = false;
  mockLayout.isTablet = true;
};

it("shows web group cards and the Create Group destination", async () => {
  webLayout();
  (GroupService.getGroups as jest.Mock).mockResolvedValue({
    data: [group("Family")],
    error: null,
  });
  render(<GroupsScreen />);
  await waitFor(() => expect(screen.getByText("Family")).toBeTruthy());
  expect(screen.getByText("Owner")).toBeTruthy();
  fireEvent.press(screen.getByText("Create Group"));
  expect(router.push).toHaveBeenCalledWith("/groups/create");
});

it("limits member web controls to vehicles and leaving the group", async () => {
  webLayout();
  (GroupService.getGroupById as jest.Mock).mockResolvedValue({
    data: { ...group("Family"), owner_id: "other-user" },
    error: null,
  });
  render(<GroupDetailScreen />);
  await waitFor(() => expect(screen.getByText("Family")).toBeTruthy());
  expect(screen.queryByText("Invite Member")).toBeNull();
  expect(screen.queryByText(/Invitations \(/)).toBeNull();
  expect(screen.queryByText("Delete Group")).toBeNull();
  expect(screen.getByText("Leave Group")).toBeTruthy();
});

it("hides invitation contents if ownership changes while that tab is selected", async () => {
  webLayout();
  (GroupInvitationService.getInvitations as jest.Mock).mockResolvedValue({
    data: [
      {
        id: "invite-1",
        email: "pending@example.test",
        status: "pending",
        created_at: "2026-10-01",
      },
    ],
    error: null,
  });
  render(<GroupDetailScreen />);
  await waitFor(() => expect(screen.getByText("Invitations (1)")).toBeTruthy());
  fireEvent.press(screen.getByText("Invitations (1)"));
  expect(screen.getByText("pending@example.test")).toBeTruthy();
  (GroupService.getGroupById as jest.Mock).mockResolvedValue({
    data: { ...group("Group"), owner_id: "other-user" },
    error: null,
  });
  await setFocus();
  await waitFor(() => expect(screen.getByText("Leave Group")).toBeTruthy());
  expect(screen.queryByText("pending@example.test")).toBeNull();
  expect(screen.queryByText("Invitations (1)")).toBeNull();
});

it("keeps web member actions connected to the existing confirmation flow", async () => {
  webLayout();
  mockConfirm.mockResolvedValue(true);
  (GroupService.removeMember as jest.Mock).mockResolvedValue({ error: null });
  (GroupService.getGroupById as jest.Mock).mockResolvedValue({
    data: {
      ...group("Family"),
      group_members: [
        {
          id: "member-1",
          user_id: "user-2",
          joined_at: "2026-10-01",
          profiles: { full_name: "Wan Ahnaf", email: "wan@example.test" },
        },
      ],
    },
    error: null,
  });
  render(<GroupDetailScreen />);
  await waitFor(() => expect(screen.getByText("Wan Ahnaf")).toBeTruthy());
  fireEvent.press(screen.getByText("Remove"));
  await waitFor(() =>
    expect(GroupService.removeMember).toHaveBeenCalledWith("group-1", "user-2"),
  );
  expect(mockConfirm).toHaveBeenCalledWith(
    expect.objectContaining({ destructive: true, confirmText: "Remove" }),
  );
});

it("keeps create errors in the web form and submits trimmed values", async () => {
  webLayout();
  (GroupService.createGroup as jest.Mock).mockResolvedValue({
    error: "Couldn't create group",
  });
  render(<CreateGroupScreen />);
  fireEvent.press(screen.getByText("Create Group"));
  expect(mockShowError).toHaveBeenCalledWith("Please enter a group name");
  fireEvent.changeText(
    screen.getByPlaceholderText("Family, Work Team, etc."),
    " Family ",
  );
  fireEvent.press(screen.getByText("Create Group"));
  await waitFor(() =>
    expect(mockShowError).toHaveBeenCalledWith("Couldn't create group"),
  );
  expect(GroupService.createGroup).toHaveBeenCalledWith({
    name: "Family",
    description: undefined,
  });
  expect(router.back).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue(" Family ")).toBeTruthy();
});

it("retains the Send Another flow in the web invitation form", async () => {
  webLayout();
  mockConfirm.mockResolvedValue(true);
  (GroupInvitationService.sendInvitation as jest.Mock).mockResolvedValue({
    error: null,
  });
  render(<InviteToGroupScreen />);
  fireEvent.changeText(
    screen.getByPlaceholderText("friend@example.com"),
    "invalid",
  );
  expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
  fireEvent.changeText(
    screen.getByPlaceholderText("friend@example.com"),
    " friend@example.test ",
  );
  fireEvent.press(screen.getByText("Send Invitation"));
  await waitFor(() =>
    expect(GroupInvitationService.sendInvitation).toHaveBeenCalledWith(
      "group-1",
      "friend@example.test",
    ),
  );
  await waitFor(() =>
    expect(screen.getByPlaceholderText("friend@example.com").props.value).toBe(
      "",
    ),
  );
  expect(router.back).not.toHaveBeenCalled();
});

it("shows initials after an avatar fails and retries a changed URL", () => {
  const { rerender } = render(
    <GroupAvatar name="Wan Ahnaf" avatarUrl="https://example.test/first.png" />,
  );
  fireEvent(screen.getByLabelText("Wan Ahnaf's avatar"), "error");
  expect(screen.queryByLabelText("Wan Ahnaf's avatar")).toBeNull();
  expect(screen.getByText("WA")).toBeTruthy();
  rerender(
    <GroupAvatar
      name="Wan Ahnaf"
      avatarUrl="https://example.test/second.png"
    />,
  );
  expect(screen.getByLabelText("Wan Ahnaf's avatar")).toBeTruthy();
});

it("reloads the Groups list on focus and ignores an older response", async () => {
  let resolveFirst!: (value: any) => void;
  (GroupService.getGroups as jest.Mock)
    .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce({ data: [group("Latest group")], error: null });

  render(<GroupsScreen />);
  await setFocus();
  await waitFor(() => expect(screen.getByText("Latest group")).toBeTruthy());
  await act(async () =>
    resolveFirst({ data: [group("Stale group")], error: null }),
  );

  expect(screen.queryByText("Stale group")).toBeNull();
});

it("reloads group details and invitations on focus", async () => {
  let resolveFirst!: (value: any) => void;
  (GroupService.getGroupById as jest.Mock)
    .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce({ data: group("After"), error: null });
  (GroupInvitationService.getInvitations as jest.Mock)
    .mockResolvedValueOnce({ data: [], error: null })
    .mockResolvedValueOnce({
      data: [
        {
          id: "invite-1",
          email: "new@example.test",
          status: "pending",
          created_at: "2026-10-01",
        },
      ],
      error: null,
    });

  render(<GroupDetailScreen />);
  await setFocus();
  await waitFor(() => expect(screen.getByText("After")).toBeTruthy());
  await act(async () => resolveFirst({ data: group("Stale"), error: null }));
  expect(screen.queryByText("Stale")).toBeNull();
  fireEvent.press(screen.getByText("Invites (1)"));
  expect(screen.getByText("new@example.test")).toBeTruthy();
});

it.each([false, true])(
  "uses the shared compact Groups heading and Retry on web=%s",
  async (isWeb) => {
    mockLayout.isWeb = isWeb;
    jest
      .mocked(GroupService.getGroups)
      .mockResolvedValueOnce({ data: null, error: "Offline" } as any);
    render(<GroupsScreen />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retry groups" })).toBeTruthy(),
    );
    expect(screen.queryByText("No Groups Yet")).toBeNull();
    expect(screen.getByRole("header", { name: "Groups" })).toBeTruthy();
    jest
      .mocked(GroupService.getGroups)
      .mockResolvedValueOnce({ data: [group("Family")], error: null } as any);
    fireEvent.press(screen.getByRole("button", { name: "Retry groups" }));
    await waitFor(() => expect(screen.getByText("Family")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(mockNavigation.back).toHaveBeenCalled();
  },
);
it.each([false, true])(
  "uses selected mobile detail tabs and keeps empty sections refreshable on web=%s",
  async (isWeb) => {
    mockLayout.isWeb = isWeb;
    render(<GroupDetailScreen />);
    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: "Members (1)", selected: true }),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByRole("tab", { name: "Vehicles (0)" }));
    expect(screen.getByText("No shared vehicles")).toBeTruthy();
    expect(
      screen.UNSAFE_getByType(ScrollView).props.refreshControl,
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(
        screen.getByRole("tab", { name: "Vehicles (0)" }).props.style,
      ).minHeight,
    ).toBeGreaterThanOrEqual(48);
    expect(
      screen.getByRole("tab", { name: "Vehicles (0)", selected: true }),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(router.back).toHaveBeenCalled();
  },
);
it("keeps a failed mobile detail load recoverable without navigating away", async () => {
  jest
    .mocked(GroupService.getGroupById)
    .mockResolvedValueOnce({ data: null, error: "Offline" } as any);
  render(<GroupDetailScreen />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Retry group details" }),
    ).toBeTruthy(),
  );
  expect(router.back).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Retry group details" }));
  await waitFor(() =>
    expect(screen.getByRole("header", { name: "Group" })).toBeTruthy(),
  );
});
it("keeps mobile Create fields stable and guards saves while preserving failed drafts", async () => {
  let resolve!: (value: any) => void;
  jest.mocked(GroupService.createGroup).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(<CreateGroupScreen />);
  expect(screen.getAllByRole("header", { name: "Create Group" })).toHaveLength(
    1,
  );
  fireEvent.changeText(screen.getByLabelText("Group Name"), " Family ");
  const save = screen.getByRole("button", { name: "Create Group" });
  act(() => {
    fireEvent.press(save);
    fireEvent.press(save);
  });
  expect(GroupService.createGroup).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Group Name").props.editable).toBe(false);
  await act(async () => resolve({ error: "Offline" }));
  expect(screen.getByLabelText("Group Name").props.value).toBe(" Family ");
  expect(router.back).not.toHaveBeenCalled();
});
it("keeps the mobile invitation keyboard settings and Send Another flow", async () => {
  jest
    .mocked(GroupInvitationService.sendInvitation)
    .mockResolvedValue({ error: null } as any);
  mockConfirm.mockResolvedValueOnce(true);
  render(<InviteToGroupScreen />);
  const input = screen.getByLabelText("Email address");
  expect(input.props.keyboardType).toBe("email-address");
  expect(input.props.autoCapitalize).toBe("none");
  fireEvent.changeText(input, " person@example.test ");
  fireEvent.press(screen.getByRole("button", { name: "Send Invitation" }));
  await waitFor(() =>
    expect(GroupInvitationService.sendInvitation).toHaveBeenCalledWith(
      "group-1",
      "person@example.test",
    ),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Email address").props.value).toBe(""),
  );
});

it("hides mobile invitations immediately when ownership changes", async () => {
  jest.mocked(GroupInvitationService.getInvitations).mockResolvedValue({
    data: [
      {
        id: "invite-1",
        email: "private@example.test",
        status: "pending",
        created_at: "2026-10-01",
      },
    ],
    error: null,
  } as any);
  render(<GroupDetailScreen />);
  await waitFor(() =>
    expect(screen.getByRole("tab", { name: "Invites (1)" })).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole("tab", { name: "Invites (1)" }));
  expect(screen.getByText("private@example.test")).toBeTruthy();
  jest.mocked(GroupService.getGroupById).mockResolvedValue({
    data: { ...group("Group"), owner_id: "someone-else" },
    error: null,
  } as any);
  await setFocus();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Leave Group" })).toBeTruthy(),
  );
  expect(screen.queryByText("private@example.test")).toBeNull();
  expect(
    screen.getByRole("tab", { name: "Members (1)", selected: true }),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Invite Members" })).toBeNull();
});
it("keeps native ownership transfer connected to its confirmation and refreshed permissions", async () => {
  const owned = {
    ...group("Family"),
    member_count: 2,
    group_members: [
      {
        id: "m",
        user_id: "other",
        joined_at: "2026-10-01",
        profiles: { full_name: "Other Member", email: "other@example.test" },
      },
    ],
  };
  jest
    .mocked(GroupService.getGroupById)
    .mockResolvedValueOnce({ data: owned, error: null } as any)
    .mockResolvedValue({
      data: { ...owned, owner_id: "other" },
      error: null,
    } as any);
  jest
    .mocked(GroupService.transferOwnership)
    .mockResolvedValue({ error: null } as any);
  mockConfirm.mockResolvedValueOnce(true);
  render(<GroupDetailScreen />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Make Other Member the owner" }),
    ).toBeTruthy(),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Make Other Member the owner" }),
  );
  await waitFor(() =>
    expect(GroupService.transferOwnership).toHaveBeenCalledWith(
      "group-1",
      "other",
    ),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Leave Group" })).toBeTruthy(),
  );
  expect(screen.queryByRole("button", { name: "Delete Group" })).toBeNull();
});
it("keeps member leave behind confirmation and returns to the preceding screen", async () => {
  jest.mocked(GroupService.getGroupById).mockResolvedValue({
    data: { ...group("Family"), owner_id: "other" },
    error: null,
  } as any);
  jest
    .mocked(GroupService.leaveGroup)
    .mockResolvedValue({ error: null } as any);
  mockConfirm.mockResolvedValueOnce(true);
  render(<GroupDetailScreen />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Leave Group" })).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole("button", { name: "Leave Group" }));
  await waitFor(() =>
    expect(GroupService.leaveGroup).toHaveBeenCalledWith("group-1"),
  );
  expect(router.back).toHaveBeenCalledTimes(1);
});
it("recovers thrown create failures and keeps the draft available for retry", async () => {
  jest
    .mocked(GroupService.createGroup)
    .mockRejectedValueOnce(new Error("Offline"));
  render(<CreateGroupScreen />);
  fireEvent.changeText(screen.getByLabelText("Group Name"), "Family");
  fireEvent.press(screen.getByRole("button", { name: "Create Group" }));
  await waitFor(() =>
    expect(mockShowError).toHaveBeenCalledWith(
      "Couldn't create group. Please try again.",
    ),
  );
  expect(screen.getByLabelText("Group Name").props.editable).toBe(true);
  expect(screen.getByLabelText("Group Name").props.value).toBe("Family");
});
it("ignores a create response after leaving the form", async () => {
  let resolve!: (value: any) => void;
  jest.mocked(GroupService.createGroup).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(<CreateGroupScreen />);
  fireEvent.changeText(screen.getByLabelText("Group Name"), "Family");
  fireEvent.press(screen.getByRole("button", { name: "Create Group" }));
  view.unmount();
  await act(async () => resolve({ error: null }));
  expect(router.back).not.toHaveBeenCalled();
  expect(mockShowSuccess).not.toHaveBeenCalled();
});
it("keeps failed invitation drafts and releases the send guard for retry", async () => {
  jest
    .mocked(GroupInvitationService.sendInvitation)
    .mockRejectedValueOnce(new Error("Offline"));
  render(<InviteToGroupScreen />);
  fireEvent.changeText(
    screen.getByLabelText("Email address"),
    "person@example.test",
  );
  fireEvent.press(screen.getByRole("button", { name: "Send Invitation" }));
  await waitFor(() =>
    expect(mockShowError).toHaveBeenCalledWith(
      "Couldn't send invitation. Please try again.",
    ),
  );
  expect(screen.getByLabelText("Email address").props.editable).toBe(true);
  expect(screen.getByLabelText("Email address").props.value).toBe(
    "person@example.test",
  );
});
