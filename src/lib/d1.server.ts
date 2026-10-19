import { env } from "cloudflare:workers";

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
  const db = (env as unknown as CloudflareEnv).DB;

  if (!db) {
    throw new Error("Cloudflare D1 binding DB is missing");
  }

  return db;
}
