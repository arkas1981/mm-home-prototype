import { createServerFn } from "@tanstack/react-start";
import { getDB } from "./d1.server";

import {
  BASE_RATE,
  NONREF_DISCOUNT,
  type RateType,
} from "./booking";

type BookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  adults: number | null;
  child_ages: string | null;
  nightly_prices: string | null;
  deposit_amount: number | null;
  notes: string | null;
  name: string;
  email: string;
  phone: string;
  rate: string;
  total: number;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
  refund: number | null;
  source: string;
  expires_at: string | null;
  created_at: string;
};

type BlockRow = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
};

type OverrideRow = {
  id: string;
  start_date: string;
  end_date: string;
  price: number | null;
  min_nights: number | null;
  label: string;
  created_at: string;
};

type NightlyPriceInput = {
  date: string;
  price: number;
};

type ManualBookingInput = {
  checkIn: string;
  checkOut: string;

  name: string;
  email: string;
  phone: string;

  rate: RateType;

  adults: number;
  childAges: number[];

  nightlyPrices: NightlyPriceInput[];

  depositAmount: number;
  notes: string;
};

async function requireAdmin() {
  const {
    requireAdminSession,
  } = await import(
    "./admin-auth.server"
  );

  await requireAdminSession();
}

const addDays = (
  s: string,
  n: number
) => {
  const d = new Date(
    `${s}T12:00:00Z`
  );

  d.setUTCDate(
    d.getUTCDate() + n
  );

  return d
    .toISOString()
    .slice(0, 10);
};

const nightsOf = (
  ci: string,
  co: string
) => {
  const dates: string[] = [];

  for (
    let d = ci;
    d < co;
    d = addDays(d, 1)
  ) {
    dates.push(d);
  }

  return dates;
};

const genId = () =>
  crypto.randomUUID();

const genCode = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "MM-";

  for (let i = 0; i < 6; i++) {
    code +=
      chars[
        Math.floor(
          Math.random() *
            chars.length
        )
      ];
  }

  return code;
};

async function loadOverrides() {
  const db = getDB();

  const result = await db
    .prepare(`
      SELECT
        id,
        start_date,
        end_date,
        price,
        min_nights,
        label,
        created_at
      FROM price_overrides
      ORDER BY start_date
    `)
    .all<OverrideRow>();

  return result.results ?? [];
}

function priceForDate(
  date: string,
  overrides: OverrideRow[]
) {
  const match = [
    ...overrides,
  ]
    .reverse()
    .find(
      (o) =>
        o.price != null &&
        date >= o.start_date &&
        date <= o.end_date
    );

  return (
    match?.price ??
    BASE_RATE
  );
}

async function datesTaken(
  checkIn: string,
  checkOut: string,
  ignoreBookingId?: string
) {
  const db = getDB();

  const now =
    new Date().toISOString();

  /*
   * Same-day turnover is allowed.
   *
   * Existing:
   * 18 -> 20
   *
   * New:
   * 20 -> 22
   *
   * These do NOT overlap.
   */
  const booking = await db
    .prepare(`
      SELECT id
      FROM bookings
      WHERE
        status IN (
          'pending',
          'confirmed'
        )
        AND (
          status = 'confirmed'
          OR (
            status = 'pending'
            AND expires_at IS NOT NULL
            AND expires_at > ?
          )
        )
        AND check_in < ?
        AND check_out > ?
        ${
          ignoreBookingId
            ? "AND id != ?"
            : ""
        }
      LIMIT 1
    `)
    .bind(
      now,
      checkOut,
      checkIn,
      ...(ignoreBookingId
        ? [ignoreBookingId]
        : [])
    )
    .first<{
      id: string;
    }>();

  if (booking) {
    return true;
  }

  const block = await db
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

  return !!block;
}

function normalizeAdults(
  value: number
) {
  const adults =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(adults) ||
    adults < 1
  ) {
    return null;
  }

  return adults;
}

function normalizeChildAges(
  values: number[]
) {
  if (!Array.isArray(values)) {
    return null;
  }

  const result =
    values.map((age) =>
      Math.floor(
        Number(age)
      )
    );

  if (
    result.some(
      (age) =>
        !Number.isFinite(age) ||
        age < 0 ||
        age > 17
    )
  ) {
    return null;
  }

  return result;
}

function normalizeNightlyPrices(
  checkIn: string,
  checkOut: string,
  values: NightlyPriceInput[]
) {
  const dates =
    nightsOf(
      checkIn,
      checkOut
    );

  if (
    !Array.isArray(values) ||
    values.length !==
      dates.length
  ) {
    return null;
  }

  const prices =
    values.map(
      (item) => ({
        date:
          item.date,

        price:
          Math.round(
            Number(
              item.price
            )
          ),
      })
    );

  const valid =
    dates.every(
      (date, index) =>
        prices[index]
          ?.date === date &&
        Number.isFinite(
          prices[index]
            ?.price
        ) &&
        (
          prices[index]
            ?.price ??
          -1
        ) >= 0
    );

  return valid
    ? prices
    : null;
}

function normalizeDeposit(
  value: number,
  total: number
) {
  const deposit =
    Math.round(
      Number(value)
    );

  if (
    !Number.isFinite(
      deposit
    ) ||
    deposit < 0 ||
    deposit > total
  ) {
    return null;
  }

  return deposit;
}

function normalizeRate(
  rate: RateType
) {
  return (
    rate === "flexible" ||
    rate === "nonref"
  );
}

/* ADMIN DATA */

export const adminDataD1 =
  createServerFn({
    method: "GET",
  }).handler(async () => {
    await requireAdmin();

    const db = getDB();

    const bookings =
      await db
        .prepare(`
          SELECT *
          FROM bookings
          ORDER BY
            check_in DESC
        `)
        .all<BookingRow>();

    const blocks =
      await db
        .prepare(`
          SELECT *
          FROM blocks
          ORDER BY
            start_date
        `)
        .all<BlockRow>();

    const overrides =
      await db
        .prepare(`
          SELECT *
          FROM price_overrides
          ORDER BY
            start_date
        `)
        .all<OverrideRow>();

    return {
      bookings:
        bookings.results ??
        [],

      blocks:
        blocks.results ??
        [],

      overrides:
        overrides.results ??
        [],
    };
  });

/* MANUAL BOOKING CREATE */

export const adminCreateBookingD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (
        d: ManualBookingInput
      ) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        if (
          !data.checkIn ||
          !data.checkOut ||
          data.checkOut <=
            data.checkIn
        ) {
          return {
            error:
              "order" as const,
          };
        }

        if (
          !normalizeRate(
            data.rate
          )
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        if (
          await datesTaken(
            data.checkIn,
            data.checkOut
          )
        ) {
          return {
            error:
              "taken" as const,
          };
        }

        const adults =
          normalizeAdults(
            data.adults
          );

        if (
          adults === null
        ) {
          return {
            error:
              "guests" as const,
          };
        }

        const childAges =
          normalizeChildAges(
            data.childAges
          );

        if (
          childAges === null
        ) {
          return {
            error:
              "guests" as const,
          };
        }

        /*
         * No maximum guest limit
         * for manual bookings.
         */
        const guests =
          adults +
          childAges.length;

        const nightlyPrices =
          normalizeNightlyPrices(
            data.checkIn,
            data.checkOut,
            data.nightlyPrices
          );

        if (
          nightlyPrices ===
          null
        ) {
          return {
            error:
              "prices" as const,
          };
        }

        const total =
          nightlyPrices.reduce(
            (sum, item) =>
              sum +
              item.price,
            0
          );

        const depositAmount =
          normalizeDeposit(
            data.depositAmount,
            total
          );

        if (
          depositAmount ===
          null
        ) {
          return {
            error:
              "deposit" as const,
          };
        }

        const db =
          getDB();

        await db
          .prepare(`
            INSERT INTO bookings (
              id,
              code,
              check_in,
              check_out,
              guests,
              adults,
              child_ages,
              nightly_prices,
              deposit_amount,
              notes,
              name,
              email,
              phone,
              rate,
              total,
              status,
              payment_status,
              source,
              expires_at
            )
            VALUES (
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              'confirmed',
              'paid',
              'manual',
              NULL
            )
          `)
          .bind(
            genId(),
            genCode(),

            data.checkIn,
            data.checkOut,

            guests,
            adults,

            JSON.stringify(
              childAges
            ),

            JSON.stringify(
              nightlyPrices
            ),

            depositAmount,

            (
              data.notes ??
              ""
            )
              .trim()
              .slice(
                0,
                2000
              ),

            data.name
              .trim()
              .slice(
                0,
                100
              ),

            data.email
              .trim()
              .toLowerCase()
              .slice(
                0,
                255
              ),

            data.phone
              .trim()
              .slice(
                0,
                30
              ),

            data.rate,

            total
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );

/* MANUAL BOOKING UPDATE */

type ManualBookingUpdateInput =
  ManualBookingInput & {
    id: string;
  };

export const adminUpdateBookingD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (
        d: ManualBookingUpdateInput
      ) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        const db =
          getDB();

        const existing =
          await db
            .prepare(`
              SELECT
                id,
                source
              FROM bookings
              WHERE id = ?
              LIMIT 1
            `)
            .bind(
              data.id
            )
            .first<{
              id: string;
              source: string;
            }>();

        if (
          !existing ||
          existing.source !==
            "manual"
        ) {
          return {
            error:
              "not_manual" as const,
          };
        }

        if (
          !data.checkIn ||
          !data.checkOut ||
          data.checkOut <=
            data.checkIn
        ) {
          return {
            error:
              "order" as const,
          };
        }

        if (
          !normalizeRate(
            data.rate
          )
        ) {
          return {
            error:
              "invalid" as const,
          };
        }

        if (
          await datesTaken(
            data.checkIn,
            data.checkOut,
            data.id
          )
        ) {
          return {
            error:
              "taken" as const,
          };
        }

        const adults =
          normalizeAdults(
            data.adults
          );

        if (
          adults === null
        ) {
          return {
            error:
              "guests" as const,
          };
        }

        const childAges =
          normalizeChildAges(
            data.childAges
          );

        if (
          childAges === null
        ) {
          return {
            error:
              "guests" as const,
          };
        }

        const guests =
          adults +
          childAges.length;

        const nightlyPrices =
          normalizeNightlyPrices(
            data.checkIn,
            data.checkOut,
            data.nightlyPrices
          );

        if (
          nightlyPrices ===
          null
        ) {
          return {
            error:
              "prices" as const,
          };
        }

        const total =
          nightlyPrices.reduce(
            (sum, item) =>
              sum +
              item.price,
            0
          );

        const depositAmount =
          normalizeDeposit(
            data.depositAmount,
            total
          );

        if (
          depositAmount ===
          null
        ) {
          return {
            error:
              "deposit" as const,
          };
        }

        await db
          .prepare(`
            UPDATE bookings
            SET
              check_in = ?,
              check_out = ?,
              guests = ?,
              adults = ?,
              child_ages = ?,
              nightly_prices = ?,
              deposit_amount = ?,
              notes = ?,
              name = ?,
              email = ?,
              phone = ?,
              rate = ?,
              total = ?
            WHERE
              id = ?
              AND source =
                'manual'
          `)
          .bind(
            data.checkIn,
            data.checkOut,

            guests,
            adults,

            JSON.stringify(
              childAges
            ),

            JSON.stringify(
              nightlyPrices
            ),

            depositAmount,

            (
              data.notes ??
              ""
            )
              .trim()
              .slice(
                0,
                2000
              ),

            data.name
              .trim()
              .slice(
                0,
                100
              ),

            data.email
              .trim()
              .toLowerCase()
              .slice(
                0,
                255
              ),

            data.phone
              .trim()
              .slice(
                0,
                30
              ),

            data.rate,
            total,
            data.id
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );

/* BOOKING STATUS */

export const adminSetBookingStatusD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        id: string;
        status:
          | "confirmed"
          | "cancelled";
      }) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        const db =
          getDB();

        const booking =
          await db
            .prepare(`
              SELECT
                id,
                check_in,
                check_out
              FROM bookings
              WHERE id = ?
            `)
            .bind(
              data.id
            )
            .first<{
              id: string;
              check_in: string;
              check_out: string;
            }>();

        if (!booking) {
          return {
            error:
              "invalid" as const,
          };
        }

        if (
          data.status ===
          "confirmed"
        ) {
          if (
            await datesTaken(
              booking.check_in,
              booking.check_out,
              booking.id
            )
          ) {
            return {
              error:
                "taken" as const,
            };
          }

          await db
            .prepare(`
              UPDATE bookings
              SET
                status =
                  'confirmed',
                refund = NULL,
                expires_at =
                  NULL
              WHERE id = ?
            `)
            .bind(
              data.id
            )
            .run();
        } else {
          await db
            .prepare(`
              UPDATE bookings
              SET
                status =
                  'cancelled',
                refund = 0
              WHERE id = ?
            `)
            .bind(
              data.id
            )
            .run();
        }

        return {
          ok:
            true as const,
        };
      }
    );

/* BLOCKS */

export const adminAddBlockD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        start: string;
        end: string;
        reason: string;
      }) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        if (
          !data.start ||
          !data.end ||
          data.end <
            data.start
        ) {
          return {
            error:
              "order" as const,
          };
        }

        if (
          await datesTaken(
            data.start,
            data.end
          )
        ) {
          return {
            error:
              "taken" as const,
          };
        }

        const db =
          getDB();

        await db
          .prepare(`
            INSERT INTO blocks (
              id,
              start_date,
              end_date,
              reason
            )
            VALUES (
              ?, ?, ?, ?
            )
          `)
          .bind(
            genId(),
            data.start,
            data.end,

            data.reason
              .trim() ||
              "Blocked"
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );

export const adminRemoveBlockD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        id: string;
      }) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        const db =
          getDB();

        await db
          .prepare(`
            DELETE FROM blocks
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

/* PRICE OVERRIDES */

export const adminAddOverrideD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        start: string;
        end: string;
        price?: number;
        minNights?: number;
        label?: string;
      }) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        if (
          !data.start ||
          !data.end ||
          data.end <
            data.start ||
          (
            !data.price &&
            !data.minNights
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
            INSERT INTO price_overrides (
              id,
              start_date,
              end_date,
              price,
              min_nights,
              label
            )
            VALUES (
              ?, ?, ?, ?, ?, ?
            )
          `)
          .bind(
            genId(),

            data.start,
            data.end,

            data.price
              ? Math.max(
                  1,
                  Math.floor(
                    data.price
                  )
                )
              : null,

            data.minNights
              ? Math.max(
                  1,
                  Math.floor(
                    data.minNights
                  )
                )
              : null,

            (
              data.label ??
              ""
            ).slice(
              0,
              100
            )
          )
          .run();

        return {
          ok:
            true as const,
        };
      }
    );

export const adminRemoveOverrideD1 =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        id: string;
      }) => d
    )
    .handler(
      async ({ data }) => {
        await requireAdmin();

        const db =
          getDB();

        await db
          .prepare(`
            DELETE FROM
              price_overrides
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
