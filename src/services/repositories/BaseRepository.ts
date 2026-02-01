/**
 * Base Repository
 *
 * Provides generic CRUD operations for Supabase tables.
 * Specific repositories extend this class to add domain-specific logic.
 */

import { supabase } from "../api/supabaseClient";
import type { Result } from "@/src/types";

export interface QueryFilters {
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  eq?: Record<string, unknown>;
  in?: Record<string, unknown[]>;
  gte?: Record<string, unknown>;
  lte?: Record<string, unknown>;
  like?: Record<string, string>;
  ilike?: Record<string, string>;
}

export interface RepositoryError {
  code: string;
  message: string;
  details?: unknown;
}

export abstract class BaseRepository<TRow, TInsert, TUpdate> {
  protected abstract tableName: string;

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<Result<TRow, RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
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

    return { success: true, data: data as TRow };
  }

  /**
   * Find all records with optional filters
   */
  async findAll(
    filters?: QueryFilters,
  ): Promise<Result<TRow[], RepositoryError>> {
    let query = supabase.from(this.tableName).select("*");

    if (filters) {
      query = this.applyFilters(query, filters) as typeof query;
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

    return { success: true, data: (data || []) as TRow[] };
  }

  /**
   * Find records by user ID
   */
  async findByUserId(
    userId: string,
    filters?: QueryFilters,
  ): Promise<Result<TRow[], RepositoryError>> {
    let query = supabase.from(this.tableName).select("*").eq("user_id", userId);

    if (filters) {
      query = this.applyFilters(query, filters) as typeof query;
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

    return { success: true, data: (data || []) as TRow[] };
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<Result<TRow, RepositoryError>> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data as never)
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

    return { success: true, data: created as TRow };
  }

  /**
   * Create multiple records
   */
  async createMany(items: TInsert[]): Promise<Result<TRow[], RepositoryError>> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(items as never[])
      .select();

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

    return { success: true, data: (created || []) as TRow[] };
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: TUpdate,
  ): Promise<Result<TRow, RepositoryError>> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data as never)
      .eq("id", id)
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

    return { success: true, data: updated as TRow };
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);

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
   * Delete records by user ID
   */
  async deleteByUserId(userId: string): Promise<Result<void, RepositoryError>> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
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
   * Count records with optional filters
   */
  async count(
    filters?: QueryFilters,
  ): Promise<Result<number, RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (filters?.eq) {
      for (const [key, value] of Object.entries(filters.eq)) {
        query = query.eq(key, value as string);
      }
    }

    const { count, error } = await query;

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

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<Result<boolean, RepositoryError>> {
    const result = await this.count({ eq: { id } });
    if (!result.success) {
      return result;
    }
    return { success: true, data: result.data > 0 };
  }

  /**
   * Apply filters to a query
   */
  protected applyFilters<
    T extends {
      eq: Function;
      in: Function;
      gte: Function;
      lte: Function;
      like: Function;
      ilike: Function;
      order: Function;
      limit: Function;
      range: Function;
    },
  >(query: T, filters: QueryFilters): T {
    let filteredQuery = query;

    if (filters.eq) {
      for (const [key, value] of Object.entries(filters.eq)) {
        filteredQuery = filteredQuery.eq(key, value) as T;
      }
    }

    if (filters.in) {
      for (const [key, values] of Object.entries(filters.in)) {
        filteredQuery = filteredQuery.in(key, values) as T;
      }
    }

    if (filters.gte) {
      for (const [key, value] of Object.entries(filters.gte)) {
        filteredQuery = filteredQuery.gte(key, value) as T;
      }
    }

    if (filters.lte) {
      for (const [key, value] of Object.entries(filters.lte)) {
        filteredQuery = filteredQuery.lte(key, value) as T;
      }
    }

    if (filters.like) {
      for (const [key, value] of Object.entries(filters.like)) {
        filteredQuery = filteredQuery.like(key, value) as T;
      }
    }

    if (filters.ilike) {
      for (const [key, value] of Object.entries(filters.ilike)) {
        filteredQuery = filteredQuery.ilike(key, value) as T;
      }
    }

    if (filters.orderBy) {
      filteredQuery = filteredQuery.order(filters.orderBy.column, {
        ascending: filters.orderBy.ascending ?? true,
      }) as T;
    }

    if (filters.limit) {
      filteredQuery = filteredQuery.limit(filters.limit) as T;
    }

    if (filters.offset) {
      filteredQuery = filteredQuery.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      ) as T;
    }

    return filteredQuery;
  }
}
