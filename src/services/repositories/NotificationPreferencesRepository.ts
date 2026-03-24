/**
 * Notification Preferences Repository
 *
 * Data access layer for the notification_preferences table.
 * Each user has at most one row (upsert pattern).
 */

import { supabase } from "../api/supabaseClient";
import type { Result } from "@/src/types";
import { BaseRepository, type RepositoryError } from "./BaseRepository";
import { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["notification_preferences"]["Row"];
type Insert =
  Database["public"]["Tables"]["notification_preferences"]["Insert"];
type Update =
  Database["public"]["Tables"]["notification_preferences"]["Update"];

export class NotificationPreferencesRepository extends BaseRepository<
  Row,
  Insert,
  Update
> {
  protected tableName = "notification_preferences";

  /**
   * Find preferences for a specific user (single row)
   */
  async findByUser(
    userId: string,
  ): Promise<Result<Row | null, RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
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

    return { success: true, data: data as Row | null };
  }

  /**
   * Upsert preferences — creates with defaults if none exists, updates otherwise
   */
  async upsert(
    userId: string,
    data: Partial<Update>,
  ): Promise<Result<Row, RepositoryError>> {
    const { data: upserted, error } = await supabase
      .from(this.tableName)
      .upsert({ user_id: userId, ...data } as never, { onConflict: "user_id" })
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

    return { success: true, data: upserted as Row };
  }
}

export const notificationPreferencesRepository =
  new NotificationPreferencesRepository();
