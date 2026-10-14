export interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{
        results: T[];
        success: boolean;
      }>;
      run(): Promise<unknown>;
    };
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{
      results: T[];
      success: boolean;
    }>;
    run(): Promise<unknown>;
  };
}

type CloudflareEnv = {
  DB?: D1Database;
};

export function getDB(): D1Database {
  const env = globalThis.__CLOUDFLARE_ENV__ as
    | CloudflareEnv
    | undefined;

  const db = env?.DB;

  if (!db) {
    throw new Error(
      "Cloudflare D1 binding DB is not available."
    );
  }

  return db;
}
