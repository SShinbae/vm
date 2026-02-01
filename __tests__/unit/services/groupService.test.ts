/**
 * Group Service Tests
 *
 * Tests for GroupService and GroupInvitationService covering
 * group CRUD, member management, invitations, and ownership transfer.
 */

import {
  GroupService,
  GroupInvitationService,
} from "@/lib/services/groupService";
import {
  createSupabaseMock,
  createUnauthenticatedMock,
  MockDataBuilders,
  createMockQueryBuilder,
} from "../../setup/supabaseMock";

// Mock the supabase client
jest.mock("@/services/supabaseClient", () => ({
  supabase: {},
}));

describe("Group Services", () => {
  let mockSupabase: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createSupabaseMock();
    jest.requireMock("@/services/supabaseClient").supabase = mockSupabase;
  });

  // ==========================================================================
  // GroupService Tests
  // ==========================================================================

  describe("GroupService", () => {
    describe("getGroups", () => {
      it("should fetch owned and member groups", async () => {
        const ownedGroup = MockDataBuilders.group({
          id: "owned-1",
          name: "My Group",
        });
        // Member group for testing - used in mock implementation
        MockDataBuilders.group({
          id: "member-1",
          name: "Shared Group",
          owner_id: "other-user",
        });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [{ ...ownedGroup, group_members: [] }],
                error: null,
              }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ group_id: "member-1" }],
                error: null,
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupService.getGroups();

        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
      });

      it("should include member count in response", async () => {
        const group = {
          ...MockDataBuilders.group(),
          group_members: [
            { id: "m1", user_id: "user-1" },
            { id: "m2", user_id: "user-2" },
          ],
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest
                .fn()
                .mockResolvedValue({ data: [group], error: null }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupService.getGroups();

        expect(result.data?.[0].member_count).toBe(2);
      });

      it("should return error when user not authenticated", async () => {
        const unauthMock = createUnauthenticatedMock();
        jest.requireMock("@/services/supabaseClient").supabase = unauthMock;

        const result = await GroupService.getGroups();

        expect(result.error).toBe("User not authenticated");
        expect(result.data).toBeNull();
      });
    });

    describe("getGroupById", () => {
      it("should fetch group with members and profiles", async () => {
        const group = MockDataBuilders.group();
        const members = [{ id: "m1", user_id: "user-1", group_id: "group-1" }];
        const profiles = [
          {
            id: "user-1",
            email: "user@example.com",
            full_name: "User One",
            avatar_url: null,
          },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: group, error: null }),
              }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: members, error: null }),
            };
          }
          if (table === "profiles") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({ data: profiles, error: null }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupService.getGroupById("group-1");

        expect(result.error).toBeNull();
        expect(result.data?.member_count).toBe(1);
        expect(result.data?.group_members?.[0]?.profiles).toBeDefined();
      });
    });

    describe("createGroup", () => {
      it("should create group and add owner as member", async () => {
        const newGroup = MockDataBuilders.group();
        const insertMock = jest
          .fn()
          .mockResolvedValue({ data: null, error: null });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest
                    .fn()
                    .mockResolvedValue({ data: newGroup, error: null }),
                }),
              }),
            };
          }
          if (table === "group_members") {
            return { ...createMockQueryBuilder(), insert: insertMock };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupService.createGroup({
          name: "New Group",
          description: "A new test group",
        });

        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            group_id: newGroup.id,
            user_id: "test-user-id",
          }),
        );
      });

      it("should return error when user not authenticated", async () => {
        const unauthMock = createUnauthenticatedMock();
        jest.requireMock("@/services/supabaseClient").supabase = unauthMock;

        const result = await GroupService.createGroup({
          name: "New Group",
        });

        expect(result.error).toBe("User not authenticated");
      });
    });

    describe("updateGroup", () => {
      it("should update group details", async () => {
        const updatedGroup = MockDataBuilders.group({ name: "Updated Name" });

        mockSupabase.from.mockImplementation(() => ({
          ...createMockQueryBuilder(),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: updatedGroup, error: null }),
              }),
            }),
          }),
        }));

        const result = await GroupService.updateGroup("group-1", {
          name: "Updated Name",
        });

        expect(result.error).toBeNull();
        expect(result.data?.name).toBe("Updated Name");
      });
    });

    describe("deleteGroup", () => {
      it("should delete group successfully", async () => {
        mockSupabase.from.mockImplementation(() => ({
          ...createMockQueryBuilder(),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }));

        const result = await GroupService.deleteGroup("group-1");

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      });
    });

    describe("leaveGroup", () => {
      it("should allow non-owner to leave group", async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "different-user-id" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              delete: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupService.leaveGroup("group-1");

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      });

      it("should prevent owner from leaving their own group", async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "test-user-id" },
                  error: null,
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupService.leaveGroup("group-1");

        expect(result.error).toContain("Group owners cannot leave");
      });
    });

    describe("removeMember", () => {
      it("should remove member from group", async () => {
        mockSupabase.from.mockImplementation(() => ({
          ...createMockQueryBuilder(),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }));

        const result = await GroupService.removeMember("group-1", "user-1");

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      });
    });
  });

  // ==========================================================================
  // GroupInvitationService Tests
  // ==========================================================================

  describe("GroupInvitationService", () => {
    describe("sendInvitation", () => {
      it("should send invitation with 7-day expiry", async () => {
        const invitation = MockDataBuilders.groupInvitation();
        const insertMock = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: invitation, error: null }),
          }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "test-user-id" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_invitations") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
              insert: insertMock,
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.sendInvitation(
          "group-1",
          "invitee@example.com",
        );

        expect(result.error).toBeNull();
        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "invitee@example.com",
            expires_at: expect.any(String),
          }),
        );
      });

      it("should prevent duplicate pending invitations", async () => {
        const existingInvitation = MockDataBuilders.groupInvitation();

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "test-user-id" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_invitations") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [existingInvitation],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.sendInvitation(
          "group-1",
          "invitee@example.com",
        );

        expect(result.error).toContain("already been sent");
      });

      it("should prevent inviting existing members", async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "test-user-id" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_invitations") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: "member-1" }],
                  error: null,
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.sendInvitation(
          "group-1",
          "member@example.com",
        );

        expect(result.error).toBe("This user is already a member of the group");
      });

      it("should require user to be owner or member to send invitations", async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "different-user" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.sendInvitation(
          "group-1",
          "invitee@example.com",
        );

        expect(result.error).toContain("must be a member");
      });
    });

    describe("acceptInvitation", () => {
      it("should accept invitation and add user to group", async () => {
        const invitation = {
          ...MockDataBuilders.groupInvitation(),
          groups: { name: "Test Group" },
        };
        const memberInsertMock = jest
          .fn()
          .mockResolvedValue({ data: null, error: null });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { email: "invitee@example.com" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_invitations") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest
                      .fn()
                      .mockResolvedValue({ data: invitation, error: null }),
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest
                    .fn()
                    .mockResolvedValue({ data: [{}], error: null }),
                }),
              }),
            };
          }
          if (table === "group_members") {
            return { ...createMockQueryBuilder(), insert: memberInsertMock };
          }
          return createMockQueryBuilder();
        });

        const result =
          await GroupInvitationService.acceptInvitation("invitation-1");

        expect(result.error).toBeNull();
        expect(result.data?.groupName).toBe("Test Group");
        expect(memberInsertMock).toHaveBeenCalled();
      });

      it("should reject expired invitations", async () => {
        const expiredInvitation = {
          ...MockDataBuilders.groupInvitation(),
          expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
          groups: { name: "Test Group" },
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { email: "invitee@example.com" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_invitations") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: expiredInvitation,
                      error: null,
                    }),
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result =
          await GroupInvitationService.acceptInvitation("invitation-1");

        expect(result.error).toBe("This invitation has expired");
      });
    });

    describe("declineInvitation", () => {
      it("should update invitation status to declined", async () => {
        const updateMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { email: "invitee@example.com" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_invitations") {
            return { ...createMockQueryBuilder(), update: updateMock };
          }
          return createMockQueryBuilder();
        });

        const result =
          await GroupInvitationService.declineInvitation("invitation-1");

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      });
    });

    describe("cancelInvitation", () => {
      it("should delete invitation", async () => {
        mockSupabase.from.mockImplementation(() => ({
          ...createMockQueryBuilder(),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }));

        const result =
          await GroupInvitationService.cancelInvitation("invitation-1");

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      });
    });

    describe("transferOwnership", () => {
      it("should transfer ownership to existing member", async () => {
        const updateMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "test-user-id", name: "Test Group" },
                  error: null,
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { user_id: "new-owner-id" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.transferOwnership(
          "group-1",
          "new-owner-id",
        );

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      });

      it("should reject transfer to non-member", async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "test-user-id", name: "Test Group" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "group_members") {
            return {
              ...createMockQueryBuilder(),
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Not found" },
                  }),
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.transferOwnership(
          "group-1",
          "non-member-id",
        );

        expect(result.error).toBe("New owner must be a member of the group");
      });

      it("should only allow current owner to transfer", async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "groups") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: "different-user-id", name: "Test Group" },
                  error: null,
                }),
              }),
            };
          }
          return createMockQueryBuilder();
        });

        const result = await GroupInvitationService.transferOwnership(
          "group-1",
          "new-owner-id",
        );

        expect(result.error).toBe(
          "Only the group owner can transfer ownership",
        );
      });
    });
  });
});
