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
                name,
                source
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
              source: string;
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
         * Permanent deletion is allowed
         * only for manually created bookings.
         *
         * Online / Stripe bookings must remain
         * in the historical record and should
         * be cancelled instead.
         */
        if (
          booking.source !==
          "manual"
        ) {
          return {
            error:
              "not_manual" as const,
          };
        }

        /*
         * Find review photos linked to
         * this booking before deleting
         * database rows.
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
         * from R2.
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
         * Remove review photo records.
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
         * Remove reviews.
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
         * Remove email notification records.
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
              AND source =
                'manual'
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
