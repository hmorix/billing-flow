/**
 * Browser Local Database Cache Storage
 * Provides instant 0ms cache-first data retrieval, tenant isolation,
 * and smart cache invalidation for BillingFlow.
 */

interface CacheEntry<T = any> {
  data: T;
  ts: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry>();
const CACHE_PREFIX = 'bf_cache_';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh TTL

function getStorageKey(endpoint: string, orgId: string = 'global'): string {
  return `${CACHE_PREFIX}${orgId}:${endpoint}`;
}

export const browserCache = {
  /**
   * Get cached data for an endpoint and tenant.
   * Returns data if present in memory or localStorage.
   */
  get<T = any>(endpoint: string, orgId: string = 'global', maxAgeMs = DEFAULT_TTL_MS): { data: T; isFresh: boolean } | null {
    const key = getStorageKey(endpoint, orgId);

    // 1. Check in-memory fast tier
    if (MEMORY_CACHE.has(key)) {
      const entry = MEMORY_CACHE.get(key)!;
      const isFresh = Date.now() - entry.ts < maxAgeMs;
      return { data: entry.data as T, isFresh };
    }

    // 2. Check persistent localStorage tier
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        // Hydrate memory cache
        MEMORY_CACHE.set(key, parsed);
        const isFresh = Date.now() - parsed.ts < maxAgeMs;
        return { data: parsed.data, isFresh };
      }
    } catch {
      // Ignore storage read errors
    }

    return null;
  },

  /**
   * Store data in memory and persistent browser storage.
   */
  set<T = any>(endpoint: string, data: T, orgId: string = 'global'): void {
    const key = getStorageKey(endpoint, orgId);
    const entry: CacheEntry<T> = { data, ts: Date.now() };

    // Update memory
    MEMORY_CACHE.set(key, entry);

    // Update persistent storage
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // If quota exceeded, clear stale cache entries
      this.pruneOldEntries();
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch {
        // Safe failover
      }
    }
  },

  /**
   * Invalidate specific endpoints or patterns for a tenant.
   * Example: invalidate('invoices', orgId) clears /api/invoices and /api/invoices/:id
   */
  invalidate(pattern: string, orgId: string = 'global'): void {
    const prefix = `${CACHE_PREFIX}${orgId}:`;

    // Clear matching memory keys
    for (const key of MEMORY_CACHE.keys()) {
      if (key.startsWith(prefix) && key.includes(pattern)) {
        MEMORY_CACHE.delete(key);
      }
    }

    // Clear matching localStorage keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix) && k.includes(pattern)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore errors
    }
  },

  /**
   * Smart invalidation on mutations (POST/PUT/DELETE).
   */
  invalidateForMutation(endpoint: string, orgId: string = 'global'): void {
    if (endpoint.includes('/invoices')) {
      this.invalidate('/api/invoices', orgId);
      this.invalidate('/api/analytics', orgId);
    } else if (endpoint.includes('/clients')) {
      this.invalidate('/api/clients', orgId);
      this.invalidate('/api/invoices', orgId);
      this.invalidate('/api/analytics', orgId);
    } else if (endpoint.includes('/agreements')) {
      this.invalidate('/api/agreements', orgId);
    } else if (endpoint.includes('/organization')) {
      this.invalidate('/api/organization', orgId);
      this.invalidate('/api/auth/me', orgId);
      this.invalidate('/api/analytics', orgId);
    } else if (endpoint.includes('/billing')) {
      this.invalidate('/api/billing', orgId);
      this.invalidate('/api/auth/me', orgId);
      this.invalidate('/api/analytics', orgId);
    } else if (endpoint.includes('/admin')) {
      this.invalidate('/api/admin', orgId);
    } else {
      // General fallback: clear related endpoint
      this.invalidate(endpoint.split('?')[0], orgId);
    }
  },

  /**
   * Prune expired or excessive cache entries from localStorage.
   */
  pruneOldEntries(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '{}');
            if (now - (parsed.ts || 0) > 24 * 60 * 60 * 1000) {
              keysToRemove.push(k);
            }
          } catch {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  },

  /**
   * Completely clear all cached data across all tenants (e.g. on logout).
   */
  clearAll(): void {
    MEMORY_CACHE.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }
};
