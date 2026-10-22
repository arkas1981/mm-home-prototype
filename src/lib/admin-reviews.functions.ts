import {
  createServerFn,
} from "@tanstack/react-start";

import {
  getDB,
} from "./d1.server";

export type AdminReviewRow = {
  id: string;
  booking_id: string;
  booking_code: string;
  name: string;
  rating: number;
  text: string;
  status:
    | "pending"
    | "approved"
    | "rejected";
  created_at: string;
};

async function requireAdmin() {
  const {
    requireAdminSession,
  } =
    await import(
      "./admin-auth.server"
    );

  await requireAdminSession();
}

async function ensureReviewsTable() {
  const db =
    getDB();

  await db
    .prepare(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL UNIQUE,
        booking_code TEXT NOT NULL,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    `)
    .run();

  await db
    .prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_reviews_booking_code
      ON reviews (
        booking_code
      )
    `)
    .run();
}

export const adminReviewsD1 =
  createServerFn({
    method:
      "GET",
  }).handler(
    async () => {
      await requireAdmin();

      await ensureReviewsTable();

      const db =
        getDB();

      const result =
        await db
          .prepare(`
            SELECT
              id,
              booking_id,
              booking_code,
              name,
              rating,
              text,
              status,
              created_at
            FROM reviews
            ORDER BY
              created_at DESC
          `)
          .all<AdminReviewRow>();

      return {
        reviews:
          result.results ??
          [],
      };
    }
  );

export const adminSetReviewStatusD1 =
  createServerFn({
    method:
      "POST",
  })
    .inputValidator(
      (
        data: {
          id: string;
          status:
            | "pending"
            | "approved"
            | "rejected";
        }
      ) => data
    )
    .handler(
      async ({
        data,
      }) => {
        await requireAdmin();

        if (
          !data.id ||
          ![
            "pending",
            "approved",
            "rejected",
          ].includes(
            data.status
          )
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        const db =
          getDB();

        await db
          .prepare(`
            UPDATE reviews
            SET status = ?
            WHERE id = ?
          `)
          .bind(
            data.status,
            data.id
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );

export const adminDeleteReviewD1 =
  createServerFn({
    method:
      "POST",
  })
    .inputValidator(
      (
        data: {
          id: string;
        }
      ) => data
    )
    .handler(
      async ({
        data,
      }) => {
        await requireAdmin();

        if (
          !data.id
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        const db =
          getDB();

        await db
          .prepare(`
            DELETE FROM reviews
            WHERE id = ?
          `)
          .bind(
            data.id
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );
