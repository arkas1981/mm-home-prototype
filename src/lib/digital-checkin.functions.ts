import {
  createServerFn,
} from "@tanstack/react-start";

import {
  getDB,
} from "./d1.server";

import {
  termsSections,
} from "./policies";

const TERMS_VERSION =
  "2026-11-06";

type DigitalCheckinRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  name: string;
  status: string;

  access_code:
    | string
    | null;

  terms_accepted_at:
    | string
    | null;

  terms_version:
    | string
    | null;
};

function validToken(
  token: string
) {
  return /^[a-f0-9]{64}$/i.test(
    token
  );
}

/*
 * LOAD DIGITAL CHECK-IN
 *
 * Important:
 * access_code is returned only
 * if terms have already been
 * accepted.
 */
export const getDigitalCheckin =
  createServerFn({
    method:
      "GET",
  })
    .inputValidator(
      (
        d: {
          token:
            string;
        }
      ) => d
    )
    .handler(
      async ({
        data,
      }) => {
        const token =
          String(
            data.token ??
              ""
          ).trim();

        if (
          !validToken(
            token
          )
        ) {
          return {
            error:
              "not_found" as const,
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
                check_in,
                check_out,
                name,
                status,
                access_code,
                terms_accepted_at,
                terms_version
              FROM bookings
              WHERE
                checkin_token = ?
                AND status = 'confirmed'
              LIMIT 1
            `)
            .bind(
              token
            )
            .first<
              DigitalCheckinRow
            >();

        if (
          !booking
        ) {
          return {
            error:
              "not_found" as const,
          };
        }

        const accepted =
          Boolean(
            booking
              .terms_accepted_at
          );

        return {
          booking: {
            code:
              booking.code,

            checkIn:
              booking.check_in,

            checkOut:
              booking.check_out,

            name:
              booking.name,

            accepted,

            acceptedAt:
              booking
                .terms_accepted_at,

            termsVersion:
              booking
                .terms_version,

            /*
             * Never expose
             * access code
             * before acceptance.
             */
            accessCode:
              accepted
                ? booking
                    .access_code
                : null,
          },

          terms: {
            el:
              termsSections.el,

            en:
              termsSections.en,

            version:
              TERMS_VERSION,
          },
        };
      }
    );

/*
 * ACCEPT TERMS
 *
 * Records exact timestamp and
 * terms version.
 *
 * After successful acceptance,
 * returns access_code.
 */
export const acceptDigitalCheckin =
  createServerFn({
    method:
      "POST",
  })
    .inputValidator(
      (
        d: {
          token:
            string;
        }
      ) => d
    )
    .handler(
      async ({
        data,
      }) => {
        const token =
          String(
            data.token ??
              ""
          ).trim();

        if (
          !validToken(
            token
          )
        ) {
          return {
            error:
              "not_found" as const,
          };
        }

        const db =
          getDB();

        const booking =
          await db
            .prepare(`
              SELECT
                id,
                access_code,
                terms_accepted_at,
                terms_version
              FROM bookings
              WHERE
                checkin_token = ?
                AND status = 'confirmed'
              LIMIT 1
            `)
            .bind(
              token
            )
            .first<{
              id:
                string;

              access_code:
                | string
                | null;

              terms_accepted_at:
                | string
                | null;

              terms_version:
                | string
                | null;
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
         * Do not allow digital
         * check-in to complete
         * without an access code.
         */
        if (
          !booking.access_code
        ) {
          return {
            error:
              "code_missing" as const,
          };
        }

        /*
         * If already accepted,
         * keep original timestamp.
         */
        const acceptedAt =
          booking
            .terms_accepted_at ??
          new Date()
            .toISOString();

        const termsVersion =
          booking
            .terms_version ??
          TERMS_VERSION;

        if (
          !booking
            .terms_accepted_at
        ) {
          await db
            .prepare(`
              UPDATE bookings
              SET
                terms_accepted_at = ?,
                terms_version = ?
              WHERE id = ?
            `)
            .bind(
              acceptedAt,
              TERMS_VERSION,
              booking.id
            )
            .run();
        }

        return {
          ok:
            true as const,

          acceptedAt,

          termsVersion,

          accessCode:
            booking
              .access_code,
        };
      }
    );
