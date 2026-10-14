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

export function getDB(): D1Database {
  const db = (
    process.env as unknown as { DB?: D1Database }
  ).DB;

  if (!db) {
    throw new Error(
      "Cloudflare D1 binding DB is not available in this request."
    );
  }

  return db;
}
