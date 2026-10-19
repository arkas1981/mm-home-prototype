import { createServerFn } from "@tanstack/react-start";
import { getDB } from "./d1.server";

import {
  BASE_RATE,
  DEFAULT_MIN_NIGHTS,
  LEAD_DAYS,
  MAX_GUESTS,
  NONREF_DISCOUNT,
} from "./booking";

type OverrideRow = {
  start_date: string;
  end_date: string;
  price: number | null;
  min_nights: number | null;
};

type CheckInput = {
  checkIn: string;
  checkOut: string;
  guests: number;
};

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string) => {
  const start = new Date(`${a}T12:00:00Z`);
  const end = new Date(`${b}T12:00:00Z`);

  return Math.round(
    (end.getTime() - start.getTime()) /
      86400000
  );
};

const nightsOf = (
  checkIn: string,
  checkOut: string
) => {
  const result: string[] = [];

  for (
    let d = checkIn;
    d < checkOut;
    d = addDays(d, 1)
  ) {
    result.push(d);
  }

  return result;
};

function todayAthens() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Europe/Athens",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (p) => p.type === "year"
    )?.value;

  const month =
    parts.find(
      (p) => p.type === "month"
    )?.value;

  const day =
    parts.find(
      (p) => p.type === "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function overrideFor(
  date: string,
  overrides: OverrideRow[],
  key: "price" | "min_nights"
) {
  return [...overrides]
    .reverse()
    .find(
      (o) =>
        o[key] != null &&
        date >= o.start_date &&
        date <= o.end_date
    )?.[key];
}

export const checkAvailability =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: CheckInput) => d
    )
    .handler(async ({ data }) => {
      const {
        checkIn,
        checkOut,
        guests,
      } = data;

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          checkIn
        ) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
          checkOut
        ) ||
        checkOut <= checkIn
      ) {
        return {
          available: false,
          reason:
            "order" as const,
        };
      }

      if (
        !Number.isInteger(
          guests
        ) ||
        guests < 1 ||
        guests > MAX_GUESTS
      ) {
        return {
          available: false,
          reason:
            "guests" as const,
        };
      }

      const today =
        todayAthens();

      if (
        diffDays(
          today,
          checkIn
        ) < LEAD_DAYS
      ) {
        return {
          available: false,
          reason:
            "lead" as const,
        };
      }

      const db = getDB();

      const overridesResult =
        await db
          .prepare(`
            SELECT
              start_date,
              end_date,
              price,
              min_nights
            FROM price_overrides
            ORDER BY start_date
          `)
          .all<OverrideRow>();

      const overrides =
        overridesResult.results ??
        [];

      const minNights =
        (overrideFor(
          checkIn,
          overrides,
          "min_nights"
        ) as
          | number
          | null
          | undefined) ??
        DEFAULT_MIN_NIGHTS;

      const nights =
        diffDays(
          checkIn,
          checkOut
        );

      if (
        nights < minNights
      ) {
        return {
          available: false,
          reason:
            "min" as const,
          minNights,
        };
      }

      const now =
        new Date().toISOString();

      /*
       * MM Home rule:
       *
       * Existing booking 18 -> 20
       * means new check-in can start
       * from 21, not on 20.
       *
       * Therefore checkout dates
       * count as unavailable.
       */
      const booking =
        await db
          .prepare(`
            SELECT id
            FROM bookings
            WHERE
              status IN (
                'pending',
                'confirmed'
              )
              AND (
                status =
                  'confirmed'
                OR (
                  status =
                    'pending'
                  AND expires_at
                    IS NOT NULL
                  AND expires_at > ?
                )
              )
              AND check_in <= ?
              AND check_out >= ?
            LIMIT 1
          `)
          .bind(
            now,
            checkOut,
            checkIn
          )
          .first<{
            id: string;
          }>();

      if (booking) {
        return {
          available: false,
          reason:
            "taken" as const,
        };
      }

      const block =
        await db
          .prepare(`
            SELECT id
            FROM blocks
            WHERE
              start_date <= ?
              AND end_date >= ?
            LIMIT 1
          `)
          .bind(
            checkOut,
            checkIn
          )
          .first<{
            id: string;
          }>();

      if (block) {
        return {
          available: false,
          reason:
            "taken" as const,
        };
      }

      const nightDates =
        nightsOf(
          checkIn,
          checkOut
        );

      const flexibleTotal =
        nightDates.reduce(
          (sum, date) => {
            const price =
              (overrideFor(
                date,
                overrides,
                "price"
              ) as
                | number
                | null
                | undefined) ??
              BASE_RATE;

            return (
              sum + price
            );
          },
          0
        );

      const nonRefundableTotal =
        Math.round(
          flexibleTotal *
            (1 -
              NONREF_DISCOUNT)
        );

      return {
        available: true,
        nights,
        minNights,
        flexibleTotal,
        nonRefundableTotal,
      };
    });
