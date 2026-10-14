import { cloudflareRequestEnv } from "../server";

export interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
      run(): Promise<unknown>;
    };
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
    run(): Promise<unknown>;
  };
}
export function getDB(): D1Database {
  const db = cloudflareRequestEnv.getStore()?.DB as D1Database | undefined;
  if (!db) throw new Error("Cloudflare D1 binding DB missing in request context");
  return db;
}
