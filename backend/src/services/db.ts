// src/services/db.ts
// Database abstraction layer supporting Cloudflare D1 and Supabase PostgreSQL.
// The service selects the appropriate backend based on environment variables.

import type { D1Database } from "@cloudflare/workers-types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface DBAdapter {
  // Generic query method for raw SQL (used by D1).
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  // Helper methods used across the app.
  getOrganization(id: string): Promise<any>;
  saveTemplate(data: { name: string; content: string; organizationId: string }): Promise<any>;
}

class D1Adapter implements DBAdapter {
  constructor(private db: D1Database) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const result = params.length ? stmt.bind(...params).all() : stmt.all();
    return (result.results as unknown) as T[];
  }

  async getOrganization(id: string) {
    const rows = await this.query<any>("SELECT * FROM organizations WHERE id = ?", [id]);
    return rows[0] ?? null;
  }

  async saveTemplate(data: { name: string; content: string; organizationId: string }) {
    const sql = `INSERT INTO templates (name, content, organization_id, created_at, updated_at)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`;
    const rows = await this.query<any>(sql, [data.name, data.content, data.organizationId]);
    return rows[0];
  }
}

class SupabaseAdapter implements DBAdapter {
  private client: SupabaseClient<any, "public", any>;

  constructor(private url: string, private key: string) {
    this.client = createClient(this.url, this.key);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // Supabase does not expose raw SQL; use RPC for generic queries.
    const { data, error } = await this.client.rpc('sql', { query: sql, params });
    if (error) throw error;
    return data as T[];
  }

  async getOrganization(id: string) {
    const { data, error } = await this.client.from("organizations").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }

  async saveTemplate(data: { name: string; content: string; organizationId: string }) {
    const { data: row, error } = await this.client.from("templates").insert({
      name: data.name,
      content: data.content,
      organization_id: data.organizationId,
    }).select().single();
    if (error) throw error;
    return row;
  }
}

/**
 * Factory to obtain the appropriate DBAdapter based on environment configuration.
 * If SUPABASE_URL and SUPABASE_ANON_KEY are present, Supabase is used; otherwise fallback to D1.
 */
export function getDBAdapter(env: any): DBAdapter {
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    return new SupabaseAdapter(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  if (env.DB) {
    return new D1Adapter(env.DB as D1Database);
  }
  throw new Error("No database configuration found.");
}
