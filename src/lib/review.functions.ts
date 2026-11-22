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

  RESEND_API_KEY?: string;

  REVIEW_NOTIFICATION_EMAIL?: string;
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
        p.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (p) =>
        p.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (p) =>
        p.type ===
        "day"
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

function rawBase64(
  value: string
) {
  return value.includes(",")
    ? value.slice(
        value.indexOf(
          ","
        ) + 1
      )
    : value;
}

function decodeBase64(
  value: string
) {
  const normalized =
    rawBase64(
      value
    );

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

      const normalized =
        rawBase64(
          photo.base64
        );

      const approximateBytes =
        Math.floor(
          normalized.length *
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

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function reviewNotificationEnv() {
  return env as unknown as
    CloudflareEnv;
}

async function sendReviewNotification(
  data: {
    bookingCode: string;
    guestName: string;
    displayName: string;
    rating: number;
    text: string;
    photoCount: number;
  }
) {
  const environment =
    reviewNotificationEnv();

  const apiKey =
    environment
      .RESEND_API_KEY;

  const recipient =
    environment
      .REVIEW_NOTIFICATION_EMAIL
      ?.trim();

  if (
    !apiKey ||
    !apiKey.startsWith(
      "re_"
    )
  ) {
    console.warn(
      "Review notification skipped: RESEND_API_KEY missing or invalid."
    );

    return;
  }

  if (
    !recipient
  ) {
    console.warn(
      "Review notification skipped: REVIEW_NOTIFICATION_EMAIL missing."
    );

    return;
  }

  const bookingCode =
    escapeHtml(
      data.bookingCode
    );

  const guestName =
    escapeHtml(
      data.guestName
    );

  const displayName =
    escapeHtml(
      data.displayName
    );

  const reviewText =
    escapeHtml(
      data.text
    );

  const stars =
    "★".repeat(
      data.rating
    ) +
    "☆".repeat(
      5 -
        data.rating
    );

  const photoText =
    data.photoCount ===
    0
      ? "Δεν ανέβασε φωτογραφίες."
      : data.photoCount ===
          1
      ? "Ανέβασε 1 φωτογραφία."
      : `Ανέβασε ${data.photoCount} φωτογραφίες.`;

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f6f3ee;
    font-family:Arial,Helvetica,sans-serif;
    color:#2f2a25;
  "
>
  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background:#f6f3ee;
      padding:24px 10px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            max-width:600px;
            background:#ffffff;
            border:1px solid #e9e1d6;
            border-radius:14px;
            overflow:hidden;
          "
        >

          <tr>
            <td
              style="
                padding:28px;
              "
            >

              <div
                style="
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:26px;
                  font-weight:bold;
                  color:#7a592e;
                  text-align:center;
                "
              >
                Νέα αξιολόγηση MM Home
              </div>

              <div
                style="
                  margin-top:24px;
                  padding:18px 20px;
                  background:#f7f3ec;
                  border-radius:10px;
                "
              >

                <div
                  style="
                    font-size:14px;
                    color:#766858;
                  "
                >
                  Επισκέπτης
                </div>

                <div
                  style="
                    margin-top:4px;
                    font-size:17px;
                    font-weight:bold;
                  "
                >
                  ${guestName}
                </div>

                <div
                  style="
                    margin-top:14px;
                    font-size:14px;
                    color:#766858;
                  "
                >
                  Δημόσια εμφάνιση
                </div>

                <div
                  style="
                    margin-top:4px;
                    font-size:15px;
                  "
                >
                  ${displayName}
                </div>

                <div
                  style="
                    margin-top:14px;
                    font-size:14px;
                    color:#766858;
                  "
                >
                  Κράτηση
                </div>

                <div
                  style="
                    margin-top:4px;
                    font-size:15px;
                    font-weight:bold;
                  "
                >
                  ${bookingCode}
                </div>

              </div>

              <div
                style="
                  margin-top:24px;
                  text-align:center;
                  font-size:27px;
                  letter-spacing:3px;
                  color:#8a642f;
                "
              >
                ${stars}
              </div>

              <div
                style="
                  margin-top:20px;
                  padding:20px;
                  border:1px solid #e9e1d6;
                  border-radius:10px;
                  font-size:15px;
                  line-height:1.7;
                  white-space:pre-wrap;
                "
              >
                ${reviewText}
              </div>

              <div
                style="
                  margin-top:16px;
                  font-size:13px;
                  color:#766858;
                  text-align:center;
                "
              >
                ${photoText}
              </div>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:26px;
                "
              >
                <tr>
                  <td
                    align="center"
                  >
                    <table
                      role="presentation"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          bgcolor="#365f51"
                          style="
                            border-radius:8px;
                          "
                        >
                          <a
                            href="https://mmhome.gr/admin"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:14px 26px;
                              color:#ffffff;
                              text-decoration:none;
                              font-size:15px;
                              font-weight:bold;
                            "
                          >
                            Προβολή στο Admin
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:24px 0 0;
                  text-align:center;
                  font-size:12px;
                  color:#8b837b;
                "
              >
                Η αξιολόγηση παραμένει σε αναμονή
                μέχρι να την εγκρίνετε από το Admin.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            from:
              "MM Home <info@mmhome.gr>",

            to: [
              recipient,
            ],

            reply_to:
              "info@mmhome.gr",

            subject:
              `⭐ Νέα αξιολόγηση MM Home — ${data.rating}/5 — ${data.bookingCode}`,

            html,
          }),
      }
    );

  if (
    !response.ok
  ) {
    const body =
      await response.text();

    throw new Error(
      `Review notification email failed: ${body}`
    );
  }
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

        const bucket =
          (
            env as unknown as
              CloudflareEnv
          )
            .REVIEW_PHOTOS;

        if (
          photos.length >
            0 &&
          !bucket
        ) {
          return {
            error:
              "storage" as const,
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

          if (
            photos.length >
              0 &&
            bucket
          ) {
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

          /*
           * Η ειδοποίηση email είναι
           * ανεξάρτητη από την αποθήκευση
           * της αξιολόγησης.
           *
           * Αν αποτύχει, η αξιολόγηση
           * παραμένει κανονικά στη βάση.
           */
          try {
            await sendReviewNotification({
              bookingCode:
                code,

              guestName:
                fullName,

              displayName,

              rating,

              text,

              photoCount:
                photos.length,
            });
          } catch (
            error
          ) {
            console.error(
              "Review notification email failed:",
              error
            );
          }

          return {
            ok:
              true as const,
          };
        } catch {
          try {
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
