/**
 * Group Repository
 *
 * Data access layer for group operations.
 */

import { supabase } from "../api/supabaseClient";
import {
  BaseRepository,
  QueryFilters,
  RepositoryError,
} from "./BaseRepository";
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupWithMembers,
  GroupMember,
  GroupInvitation,
  Profile,
  Result,
} from "@/src/types";

export class GroupRepository extends BaseRepository<
  Group,
  GroupInsert,
  GroupUpdate
> {
  protected tableName = "groups";

  /**
   * Find groups owned by a user
   */
  async findOwnedGroups(
    userId: string,
    filters?: QueryFilters,
  ): Promise<Result<Group[], RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("owner_id", userId);

    if (filters) {
      query = this.applyFilters(query, filters);
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: (data || []) as Group[] };
  }

  /**
   * Find groups a user is a member of
   */
  async findMemberGroups(
    userId: string,
  ): Promise<Result<Group[], RepositoryError>> {
    const { data, error } = await supabase
      .from("group_members")
      .select("groups (*)")
      .eq("user_id", userId);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    const groups = (data || [])
      .map((item: any) => item.groups)
      .filter(Boolean) as Group[];

    return { success: true, data: groups };
  }

  /**
   * Find all groups a user has access to (owned + member)
   */
  async findAccessibleGroups(
    userId: string,
  ): Promise<Result<Group[], RepositoryError>> {
    // Get owned groups
    const ownedResult = await this.findOwnedGroups(userId);
    if (!ownedResult.success) return ownedResult;

    // Get member groups
    const memberResult = await this.findMemberGroups(userId);
    if (!memberResult.success) return memberResult;

    // Combine and deduplicate
    const allGroups = [...ownedResult.data, ...memberResult.data];
    const uniqueGroups = Array.from(
      new Map(allGroups.map((g) => [g.id, g])).values(),
    );

    return { success: true, data: uniqueGroups };
  }

  /**
   * Find a group with its members
   */
  async findWithMembers(
    groupId: string,
  ): Promise<Result<GroupWithMembers, RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(
        `
        *,
        group_members (
          *,
          profiles (*)
        )
      `,
      )
      .eq("id", groupId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    const group = data as any;
    return {
      success: true,
      data: {
        ...group,
        member_count: group.group_members?.length || 0,
      } as GroupWithMembers,
    };
  }

  /**
   * Get members of a group
   */
  async getMembers(
    groupId: string,
  ): Promise<Result<(GroupMember & { profiles: Profile })[], RepositoryError>> {
    const { data, error } = await supabase
      .from("group_members")
      .select("*, profiles (*)")
      .eq("group_id", groupId);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      data: (data || []) as (GroupMember & { profiles: Profile })[],
    };
  }

  /**
   * Add a member to a group
   */
  async addMember(
    groupId: string,
    userId: string,
  ): Promise<Result<GroupMember, RepositoryError>> {
    const { data, error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: userId } as never)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: data as GroupMember };
  }

  /**
   * Remove a member from a group
   */
  async removeMember(
    groupId: string,
    userId: string,
  ): Promise<Result<void, RepositoryError>> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Check if a user is a member of a group
   */
  async isMember(
    groupId: string,
    userId: string,
  ): Promise<Result<boolean, RepositoryError>> {
    const { data, error } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: !!data };
  }

  /**
   * Check if a user is the owner of a group
   */
  async isOwner(
    groupId: string,
    userId: string,
  ): Promise<Result<boolean, RepositoryError>> {
    const result = await this.findById(groupId);
    if (!result.success) return result;
    return { success: true, data: result.data.owner_id === userId };
  }

  /**
   * Get pending invitations for a group
   */
  async getPendingInvitations(
    groupId: string,
  ): Promise<Result<GroupInvitation[], RepositoryError>> {
    const { data, error } = await supabase
      .from("group_invitations")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "pending");

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: (data || []) as GroupInvitation[] };
  }

  /**
   * Count members in a group
   */
  async getMemberCount(
    groupId: string,
  ): Promise<Result<number, RepositoryError>> {
    const { count, error } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: count || 0 };
  }
}

// Export singleton instance
export const groupRepository = new GroupRepository();
