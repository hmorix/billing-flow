import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

export class D1DatabaseAdapter {
  pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 3,                   // Vercel serverless: keep pool small
      idleTimeoutMillis: 10000, // release idle connections quickly
      connectionTimeoutMillis: 10000, // fail fast if DB is unreachable
      ssl: { rejectUnauthorized: false }, // required for Supabase pooler
    });
  }

  prepare(query: string) {
    let index = 1;
    // Replace ? with $1, $2, etc.
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    return {
      pgQuery,
      pool: this.pool,
      params: [] as any[],
      bind(...args: any[]) {
        this.params = args;
        return this;
      },
      async first() {
        const res = await this.pool.query(this.pgQuery, this.params);
        return res.rows[0] || null;
      },
      async all() {
        const res = await this.pool.query(this.pgQuery, this.params);
        return { results: res.rows };
      },
      async run() {
        const res = await this.pool.query(this.pgQuery, this.params);
        return { success: true, meta: res };
      }
    };
  }

  async batch(statements: any[]) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const stmt of statements) {
        const res = await client.query(stmt.pgQuery, stmt.params);
        results.push(res);
      }
      await client.query('COMMIT');
      return results;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export class R2ToSupabaseStorageAdapter {
  supabase: any;
  bucket: string;
  
  constructor(url: string, key: string, bucket: string) {
    this.supabase = createClient(url, key);
    this.bucket = bucket;
  }

  async get(key: string) {
    const { data, error } = await this.supabase.storage.from(this.bucket).download(key);
    if (error || !data) return null;
    
    const arrayBuf = await data.arrayBuffer();
    return {
      body: arrayBuf,
      arrayBuffer: async () => arrayBuf,
      writeHttpMetadata: (headers: any) => {
        headers.set('Content-Type', data.type);
      },
      httpEtag: `"${data.lastModified}"`
    };
  }

  async put(key: string, body: any, options: any) {
    const { data, error } = await this.supabase.storage.from(this.bucket).upload(key, body, {
      contentType: options?.httpMetadata?.contentType,
      upsert: true
    });
    if (error) throw error;
    return data;
  }

  async delete(key: string) {
    const { error } = await this.supabase.storage.from(this.bucket).remove([key]);
    if (error) throw error;
  }
}
