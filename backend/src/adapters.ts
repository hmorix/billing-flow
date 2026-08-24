import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err || '');
      const isTransient = msg.includes('nxdomain') || 
                          msg.includes('connection timeout') || 
                          msg.includes('Connection terminated') ||
                          msg.includes('ECONNRESET') ||
                          msg.includes('ETIMEDOUT') ||
                          msg.includes('closed') ||
                          msg.includes('Closed');
      if (isTransient && attempt < maxRetries) {
        console.warn(`[DB Pooler transient error attempt ${attempt}/${maxRetries}]: ${msg}. Retrying in ${attempt * 200}ms...`);
        await new Promise(r => setTimeout(r, attempt * 200));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export class D1DatabaseAdapter {
  pool: Pool;

  constructor(connectionString: string) {
    const connStr = (connectionString || process.env.DATABASE_URL || '').trim();
    if (!(globalThis as any).__pgPool) {
      (globalThis as any).__pgPool = new Pool({
        connectionString: connStr,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        ssl: { rejectUnauthorized: false },
      });

      (globalThis as any).__pgPool.on('error', (err: any) => {
        console.warn('PG Pool background idle client error:', err.message);
      });
    }
    this.pool = (globalThis as any).__pgPool;
  }

  prepare(query: string) {
    let index = 1;
    // Replace ? with $1, $2, etc.
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);

    const self = this;
    return {
      pgQuery,
      pool: this.pool,
      params: [] as any[],
      bind(...args: any[]) {
        this.params = args;
        return this;
      },
      async first() {
        return executeWithRetry(async () => {
          const res = await self.pool.query(this.pgQuery, this.params);
          return res.rows[0] || null;
        });
      },
      async all() {
        return executeWithRetry(async () => {
          const res = await self.pool.query(this.pgQuery, this.params);
          return { results: res.rows };
        });
      },
      async run() {
        return executeWithRetry(async () => {
          const res = await self.pool.query(this.pgQuery, this.params);
          return { success: true, meta: res };
        });
      }
    };
  }

  async batch(statements: any[]) {
    return executeWithRetry(async () => {
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
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    });
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
