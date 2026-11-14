import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  env,
} from "cloudflare:workers";

import {
  getDB,
} from "@/lib/d1.server";

import {
  isAdminAuthenticated,
} from "@/lib/admin-auth.server";

type R2ObjectBody = {
  body: ReadableStream;
  httpMetadata?: {
    contentType?: string;
  };
};

type R2BucketLike = {
  get(
    key: string
  ): Promise<
    R2ObjectBody | null
  >;
};

type CloudflareEnv = {
  REVIEW_PHOTOS?: R2BucketLike;
};

type PhotoRow = {
  object_key: string;
  content_type: string;
  photo_status: string;
  review_status: string;
};

export const Route =
  createFileRoute(
    "/api/review-photo/$id"
  )({
    server: {
      handlers: {
        GET: async ({
          params,
        }) => {
          const id =
            (
              params.id ??
              ""
            ).trim();

          if (
            !id
          ) {
            return new Response(
              "Not found",
              {
                status: 404,
              }
            );
          }

          const db =
            getDB();

          const photo =
            await db
              .prepare(`
                SELECT
                  rp.object_key,
                  rp.content_type,
                  rp.status
                    AS photo_status,
                  r.status
                    AS review_status
                FROM review_photos rp
                INNER JOIN reviews r
                  ON r.id =
                    rp.review_id
                WHERE
                  rp.id = ?
                LIMIT 1
              `)
              .bind(
                id
              )
              .first<PhotoRow>();

          if (
            !photo
          ) {
            return new Response(
              "Not found",
              {
                status: 404,
              }
            );
          }

          const publiclyVisible =
            photo.photo_status ===
              "approved" &&
            photo.review_status ===
              "approved";

          const admin =
            publiclyVisible
              ? false
              : await isAdminAuthenticated();

          if (
            !publiclyVisible &&
            !admin
          ) {
            return new Response(
              "Not found",
              {
                status: 404,
              }
            );
          }

          const bucket =
            (
              env as unknown as CloudflareEnv
            )
              .REVIEW_PHOTOS;

          if (
            !bucket
          ) {
            return new Response(
              "Storage unavailable",
              {
                status: 503,
              }
            );
          }

          const object =
            await bucket.get(
              photo.object_key
            );

          if (
            !object
          ) {
            return new Response(
              "Not found",
              {
                status: 404,
              }
            );
          }

          const contentType =
            object
              .httpMetadata
              ?.contentType ??
            photo.content_type ??
            "application/octet-stream";

          return new Response(
            object.body,
            {
              status: 200,

              headers: {
                "content-type":
                  contentType,

                "cache-control":
                  publiclyVisible
                    ? "public, max-age=86400"
                    : "private, no-store",

                "x-content-type-options":
                  "nosniff",
              },
            }
          );
        },
      },
    },
  });
