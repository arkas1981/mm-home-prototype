import {
  createServerFn,
} from "@tanstack/react-start";

import {
  env,
} from "cloudflare:workers";

import {
  getDB,
} from "./d1.server";

type ReviewBooking = {
  id: string;
  code: string;
  name: string;
  check_out: string;
};

type ExistingReview = {
  id: string;
};

type ReviewPhotoInput = {
  name: string;
  type: string;
  base64: string;
};

type ReviewPhotoRow = {
  id: string;
  review_id: string;
};

type R2BucketLike = {
  put(
    key: string,
    value:
      | ArrayBuffer
      | ArrayBufferView
      | string
      | ReadableStream,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    }
  ): Promise<unknown>;

  delete(
    key: string
  ): Promise<unknown>;
};

type CloudflareEnv = {
  REVIEW_PHOTOS?: R2BucketLike;
};

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
  stay_date: string;
  verified: boolean;
  photos: {
    id: string;
    url: string;
  }[];
};

function todayAthens() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Europe/Athens",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (p) =>
        p.type === "year"
    )?.value;

  const month =
    parts.find(
      (p) =>
        p.type === "month"
    )?.value;

  const day =
    parts.find(
      (p) =>
        p.type === "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function cleanName(
  value: string
) {
  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .slice(
      0,
      80
    );
}

function publicName(
  fullName: string,
  fullNameConsent: boolean
) {
  const cleaned =
    cleanName(
      fullName
    );

  if (
    fullNameConsent
  ) {
    return cleaned;
  }

  const parts =
    cleaned
      .split(" ")
      .filter(
        Boolean
      );

  if (
    parts.length <=
    1
  ) {
    return cleaned;
  }

  const firstName =
    parts[0];

  const surname =
    parts[
      parts.length -
        1
    ];

  const initial =
    surname
      ?.charAt(0)
      .toLocaleUpperCase(
        "el-GR"
      );

  return initial
    ? `${firstName} ${initial}.`
    : firstName;
}

function extensionForType(
  type: string
) {
  if (
    type ===
    "image/jpeg"
  ) {
    return "jpg";
  }

  if (
    type ===
    "image/png"
  ) {
    return "png";
  }

  if (
    type ===
    "image/webp"
  ) {
    return "webp";
  }

  return null;
}

function decodeBase64(
  value: string
) {
  const normalized =
    value.includes(",")
      ? value.slice(
          value.indexOf(
            ","
          ) + 1
        )
      : value;

  const binary =
    atob(
      normalized
    );

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i <
    binary.length;
    i += 1
  ) {
    bytes[i] =
      binary.charCodeAt(
        i
      );
  }

  return bytes;
}

function validPhotos(
  photos:
    ReviewPhotoInput[]
) {
  if (
    photos.length >
    3
  ) {
    return false;
  }

  return photos.every(
    (
      photo
    ) => {
      if (
        !extensionForType(
          photo.type
        )
      ) {
        return false;
      }

      if (
        !photo.base64
      ) {
        return false;
      }

      const approximateBytes =
        Math.floor(
          photo.base64.length *
            0.75
        );

      return (
        approximateBytes >
          0 &&
        approximateBytes <=
          5 *
            1024 *
            1024
      );
    }
  );
}

export const getApprovedReviews =
  createServerFn({
    method:
      "GET",
  }).handler(
    async () => {
      const db =
        getDB();

      const result =
        await db
          .prepare(`
            SELECT
              r.id,
              COALESCE(
                NULLIF(
                  r.display_name,
                  ''
                ),
                r.name
              ) AS name,
              r.rating,
              r.text,
              r.created_at,
              b.check_out AS stay_date
            FROM reviews r
            INNER JOIN bookings b
              ON b.id =
                r.booking_id
            WHERE
              r.status =
                'approved'
            ORDER BY
              r.created_at DESC
          `)
          .all<{
            id: string;
            name: string;
            rating: number;
            text: string;
            created_at: string;
            stay_date: string;
          }>();

      const photoResult =
        await db
          .prepare(`
            SELECT
              id,
              review_id
            FROM review_photos
            WHERE
              status =
                'approved'
            ORDER BY
              created_at ASC
          `)
          .all<ReviewPhotoRow>();

      const photosByReview =
        new Map<
          string,
          {
            id: string;
            url: string;
          }[]
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
          id:
            photo.id,

          url:
            `/api/review-photo/${photo.id}`,
        });

        photosByReview.set(
          photo.review_id,
          current
        );
      }

      const reviews:
        PublicReview[] =
        (
          result.results ??
          []
        ).map(
          (
            review
          ) => ({
            ...review,

            verified:
              true,

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

export const getReviewBooking =
  createServerFn({
    method:
      "POST",
  })
    .inputValidator(
      (
        data: {
          code: string;
        }
      ) => data
    )
    .handler(
      async ({
        data,
      }) => {
        const code =
          (
            data.code ??
            ""
          )
            .trim()
            .toUpperCase();

        if (
          !/^MM-[A-Z0-9]{6,20}$/.test(
            code
          )
        ) {
          return {
            booking:
              null,

            alreadyReviewed:
              false,
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
                check_out
              FROM bookings
              WHERE
                code = ?
                AND status =
                  'confirmed'
                AND payment_status =
                  'paid'
              LIMIT 1
            `)
            .bind(
              code
            )
            .first<ReviewBooking>();

        if (
          !booking
        ) {
          return {
            booking:
              null,

            alreadyReviewed:
              false,
          };
        }

        if (
          booking.check_out >
          todayAthens()
        ) {
          return {
            booking:
              null,

            alreadyReviewed:
              false,
          };
        }

        const existing =
          await db
            .prepare(`
              SELECT id
              FROM reviews
              WHERE
                booking_id = ?
              LIMIT 1
            `)
            .bind(
              booking.id
            )
            .first<ExistingReview>();

        return {
          booking: {
            code:
              booking.code,

            name:
              booking.name,

            checkOut:
              booking.check_out,
          },

          alreadyReviewed:
            Boolean(
              existing
            ),
        };
      }
    );

export const submitReview =
  createServerFn({
    method:
      "POST",
  })
    .inputValidator(
      (
        data: {
          code: string;

          /*
           * Παραμένει προσωρινά προαιρετικό
           * ώστε να συνεχίσει να λειτουργεί
           * και η υπάρχουσα φόρμα μέχρι
           * να την αντικαταστήσουμε.
           */
          name?: string;

          rating: number;

          text: string;

          fullNameConsent?:
            boolean;

          photos?:
            ReviewPhotoInput[];
        }
      ) => data
    )
    .handler(
      async ({
        data,
      }) => {
        const code =
          (
            data.code ??
            ""
          )
            .trim()
            .toUpperCase();

        const text =
          (
            data.text ??
            ""
          )
            .trim()
            .slice(
              0,
              1000
            );

        const rating =
          Math.floor(
            Number(
              data.rating
            )
          );

        const fullNameConsent =
          Boolean(
            data.fullNameConsent
          );

        const photos =
          Array.isArray(
            data.photos
          )
            ? data.photos
            : [];

        if (
          !/^MM-[A-Z0-9]{6,20}$/.test(
            code
          ) ||
          text.length <
            3 ||
          !Number.isInteger(
            rating
          ) ||
          rating <
            1 ||
          rating >
            5 ||
          !validPhotos(
            photos
          )
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
                check_out
              FROM bookings
              WHERE
                code = ?
                AND status =
                  'confirmed'
                AND payment_status =
                  'paid'
              LIMIT 1
            `)
            .bind(
              code
            )
            .first<ReviewBooking>();

        if (
          !booking ||
          booking.check_out >
            todayAthens()
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        const fullName =
          cleanName(
            booking.name ??
              ""
          );

        if (
          fullName.length <
          2
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        const existing =
          await db
            .prepare(`
              SELECT id
              FROM reviews
              WHERE
                booking_id = ?
              LIMIT 1
            `)
            .bind(
              booking.id
            )
            .first<{
              id: string;
            }>();

        if (
          existing
        ) {
          return {
            error:
              "already" as const,
          };
        }

        const reviewId =
          crypto.randomUUID();

        const displayName =
          publicName(
            fullName,
            fullNameConsent
          );

        const now =
          new Date()
            .toISOString();

        const uploadedKeys:
          string[] =
          [];

        try {
          if (
            photos.length >
            0
          ) {
            const bucket =
              (
                env as unknown as CloudflareEnv
              )
                .REVIEW_PHOTOS;

            if (
              !bucket
            ) {
              return {
                error:
                  "storage" as const,
              };
            }

            for (
              let index =
                0;
              index <
              photos.length;
              index += 1
            ) {
              const photo =
                photos[
                  index
                ];

              const extension =
                extensionForType(
                  photo.type
                );

              if (
                !extension
              ) {
                throw new Error(
                  "Unsupported image type"
                );
              }

              const bytes =
                decodeBase64(
                  photo.base64
                );

              if (
                bytes.byteLength >
                  5 *
                    1024 *
                    1024 ||
                bytes.byteLength ===
                  0
              ) {
                throw new Error(
                  "Invalid image size"
                );
              }

              const photoId =
                crypto.randomUUID();

              const objectKey =
                `reviews/${reviewId}/${photoId}.${extension}`;

              await bucket.put(
                objectKey,
                bytes,
                {
                  httpMetadata: {
                    contentType:
                      photo.type,
                  },
                }
              );

              uploadedKeys.push(
                objectKey
              );

              await db
                .prepare(`
                  INSERT INTO review_photos (
                    id,
                    review_id,
                    object_key,
                    content_type,
                    status,
                    created_at
                  )
                  VALUES (
                    ?, ?, ?, ?,
                    'pending', ?
                  )
                `)
                .bind(
                  photoId,
                  reviewId,
                  objectKey,
                  photo.type,
                  now
                )
                .run();
            }
          }

          await db
            .prepare(`
              INSERT INTO reviews (
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
              )
              VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?,
                'pending', ?
              )
            `)
            .bind(
              reviewId,
              booking.id,
              code,
              fullName,
              displayName,
              fullNameConsent
                ? 1
                : 0,
              rating,
              text,
              now
            )
            .run();

          return {
            ok:
              true as const,
          };
        } catch {
          try {
            const bucket =
              (
                env as unknown as CloudflareEnv
              )
                .REVIEW_PHOTOS;

            if (
              bucket
            ) {
              for (
                const key of
                uploadedKeys
              ) {
                await bucket.delete(
                  key
                );
              }
            }

            await db
              .prepare(`
                DELETE FROM review_photos
                WHERE
                  review_id = ?
              `)
              .bind(
                reviewId
              )
              .run();

            await db
              .prepare(`
                DELETE FROM reviews
                WHERE
                  id = ?
              `)
              .bind(
                reviewId
              )
              .run();
          } catch {
            // Best-effort cleanup.
          }

          return {
            error:
              "storage" as const,
          };
        }
      }
    );
