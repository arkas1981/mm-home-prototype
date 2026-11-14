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

export type AdminReviewPhoto = {
  id: string;
  review_id: string;
  object_key: string;
  content_type: string;
  status:
    | "pending"
    | "approved"
    | "rejected";
  created_at: string;
  url: string;
};

export type AdminReviewRow = {
  id: string;
  booking_id: string;
  booking_code: string;
  name: string;
  display_name:
    | string
    | null;
  full_name_consent:
    number;
  rating: number;
  text: string;
  status:
    | "pending"
    | "approved"
    | "rejected";
  created_at: string;
  photos:
    AdminReviewPhoto[];
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

export const adminReviewsD1 =
  createServerFn({
    method:
      "GET",
  }).handler(
    async () => {
      await requireAdmin();

      const db =
        getDB();

      const reviewResult =
        await db
          .prepare(`
            SELECT
              id,
              booking_id,
              booking_code,
              name,
              display_name,
              full_name_consent,
              rating,
              text,
              status,
              created_at
            FROM reviews
            ORDER BY
              created_at DESC
          `)
          .all<{
            id: string;
            booking_id: string;
            booking_code: string;
            name: string;
            display_name:
              | string
              | null;
            full_name_consent:
              number;
            rating: number;
            text: string;
            status:
              | "pending"
              | "approved"
              | "rejected";
            created_at: string;
          }>();

      const photoResult =
        await db
          .prepare(`
            SELECT
              id,
              review_id,
              object_key,
              content_type,
              status,
              created_at
            FROM review_photos
            ORDER BY
              created_at ASC
          `)
          .all<{
            id: string;
            review_id: string;
            object_key: string;
            content_type: string;
            status:
              | "pending"
              | "approved"
              | "rejected";
            created_at: string;
          }>();

      const photosByReview =
        new Map<
          string,
          AdminReviewPhoto[]
        >();

      for (
        const photo of
        photoResult.results ??
        []
      ) {
        const current =
          photosByReview.get(
            photo.review_id
          ) ??
          [];

        current.push({
          ...photo,

          url:
            `/api/review-photo/${photo.id}`,
        });

        photosByReview.set(
          photo.review_id,
          current
        );
      }

      const reviews:
        AdminReviewRow[] =
        (
          reviewResult.results ??
          []
        ).map(
          (
            review
          ) => ({
            ...review,

            photos:
              photosByReview.get(
                review.id
              ) ??
              [],
          })
        );

      return {
        reviews,
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

export const adminSetReviewPhotoStatusD1 =
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
            UPDATE review_photos
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

export const adminDeleteReviewPhotoD1 =
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

        const photo =
          await db
            .prepare(`
              SELECT
                object_key
              FROM review_photos
              WHERE id = ?
              LIMIT 1
            `)
            .bind(
              data.id
            )
            .first<{
              object_key:
                string;
            }>();

        if (
          !photo
        ) {
          return {
            error:
              "not_found" as const,
          };
        }

        const bucket =
          (
            env as unknown as CloudflareEnv
          )
            .REVIEW_PHOTOS;

        if (
          bucket
        ) {
          try {
            await bucket.delete(
              photo.object_key
            );
          } catch {
            return {
              error:
                "storage" as const,
            };
          }
        }

        await db
          .prepare(`
            DELETE FROM review_photos
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

        const photoResult =
          await db
            .prepare(`
              SELECT
                object_key
              FROM review_photos
              WHERE
                review_id = ?
          `)
          .bind(
            data.id
          )
          .all<{
            object_key:
              string;
          }>();

        const bucket =
          (
            env as unknown as CloudflareEnv
          )
            .REVIEW_PHOTOS;

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
              // Best-effort cleanup.
            }
          }
        }

        await db
          .prepare(`
            DELETE FROM review_photos
            WHERE
              review_id = ?
          `)
          .bind(
            data.id
          )
          .run();

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
