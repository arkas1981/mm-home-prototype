import {
  createServerFn,
} from "@tanstack/react-start";

import {
  env,
} from "cloudflare:workers";

import {
  getDB,
} from "./d1.server";

type R2BucketLike = {
  delete(
    key: string
  ): Promise<unknown>;
};

type CloudflareEnv = {
  REVIEW_PHOTOS?: R2BucketLike;
};

type ReviewPhotoRow = {
  object_key: string;
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

export const adminDeleteBookingD1 =
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

        const id =
          (
            data.id ??
            ""
          ).trim();

        if (
          !id
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        const db =
          getDB();

        const booking =
          await db
            .prepare(`
              SELECT
                id,
                code,
                name
              FROM bookings
              WHERE
                id = ?
              LIMIT 1
            `)
            .bind(
              id
            )
            .first<{
              id: string;
              code: string;
              name: string;
            }>();

        if (
          !booking
        ) {
          return {
            error:
              "not_found" as const,
          };
        }

        /*
         * Find any review photos
         * linked to this booking
         * before deleting database rows,
         * so the R2 objects can also
         * be removed.
         */
        const photoResult =
          await db
            .prepare(`
              SELECT
                rp.object_key
              FROM review_photos rp
              INNER JOIN reviews r
                ON r.id =
                  rp.review_id
              WHERE
                r.booking_id = ?
            `)
            .bind(
              id
            )
            .all<ReviewPhotoRow>();

        const bucket =
          (
            env as unknown as CloudflareEnv
          )
            .REVIEW_PHOTOS;

        /*
         * Remove stored review photos
         * from R2 first.
         *
         * A failed individual R2 delete
         * does not block deletion of the
         * booking from the database.
         */
        if (
          bucket
        ) {
          for (
            const photo of
            photoResult.results ??
            []
          ) {
            try {
              await bucket.delete(
                photo.object_key
              );
            } catch {
              // Best-effort R2 cleanup.
            }
          }
        }

        /*
         * Remove photo database rows
         * linked to reviews belonging
         * to this booking.
         */
        await db
          .prepare(`
            DELETE FROM review_photos
            WHERE
              review_id IN (
                SELECT id
                FROM reviews
                WHERE
                  booking_id = ?
              )
          `)
          .bind(
            id
          )
          .run();

        /*
         * Remove reviews belonging
         * to this booking.
         */
        await db
          .prepare(`
            DELETE FROM reviews
            WHERE
              booking_id = ?
          `)
          .bind(
            id
          )
          .run();

        /*
         * Remove pre-arrival /
         * post-stay notification claims
         * belonging to this booking.
         */
        await db
          .prepare(`
            DELETE FROM booking_notifications
            WHERE
              booking_id = ?
          `)
          .bind(
            id
          )
          .run();

        /*
         * Finally remove the booking.
         */
        await db
          .prepare(`
            DELETE FROM bookings
            WHERE
              id = ?
          `)
          .bind(
            id
          )
          .run();

        return {
          ok:
            true as const,

          deletedCode:
            booking.code,

          deletedName:
            booking.name,
        };
      }
    );
