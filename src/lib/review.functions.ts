import {
  createServerFn,
} from "@tanstack/react-start";

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

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
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
              id,
              name,
              rating,
              text,
              created_at
            FROM reviews
            WHERE
              status = 'approved'
            ORDER BY
              created_at DESC
          `)
          .all<PublicReview>();

      return {
        reviews:
          result.results ??
          [],
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
          name: string;
          rating: number;
          text: string;
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

        const name =
          (
            data.name ??
            ""
          )
            .trim()
            .slice(
              0,
              60
            );

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

        if (
          !/^MM-[A-Z0-9]{6,20}$/.test(
            code
          ) ||
          name.length <
            2 ||
          text.length <
            3 ||
          !Number.isInteger(
            rating
          ) ||
          rating <
            1 ||
          rating >
            5
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
            .first<{
              id: string;
              check_out: string;
            }>();

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

        await db
          .prepare(`
            INSERT INTO reviews (
              id,
              booking_id,
              booking_code,
              name,
              rating,
              text,
              status,
              created_at
            )
            VALUES (
              ?, ?, ?, ?, ?,
              ?, 'pending', ?
            )
          `)
          .bind(
            crypto.randomUUID(),
            booking.id,
            code,
            name,
            rating,
            text,
            new Date()
              .toISOString()
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );
