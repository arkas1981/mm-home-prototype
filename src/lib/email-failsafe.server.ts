import {
  getDB,
} from "./d1.server";

import {
  sendPreArrivalEmail,
} from "./prearrival-email.server";

import {
  sendPostStayEmail,
} from "./poststay-email.server";

type BookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  name: string;
  email: string;
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
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function currentAthensHour() {
  return Number(
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/Athens",
        hour:
          "2-digit",
        hour12:
          false,
      }
    ).format(
      new Date()
    )
  );
}

function addDays(
  date: string,
  days: number
) {
  const value =
    new Date(
      `${date}T12:00:00Z`
    );

  value.setUTCDate(
    value.getUTCDate() +
      days
  );

  return value
    .toISOString()
    .slice(
      0,
      10
    );
}

/*
 * PRE-ARRIVAL
 *
 * Normal target:
 * 2 days before arrival,
 * from 10:00 Athens time.
 *
 * Fail-safe:
 * if that execution failed,
 * every following hourly cron
 * retries until the guest's
 * arrival date.
 *
 * booking_notifications +
 * sendPreArrivalEmail.claim()
 * prevent duplicate emails.
 */
async function runPreArrivalFailSafe() {
  const today =
    todayAthens();

  const hour =
    currentAthensHour();

  /*
   * Before 10:00 today we do NOT
   * send emails whose normal due
   * time is 10:00 today.
   *
   * But we do retry older missed
   * pre-arrival emails.
   */
  const maxCheckIn =
    addDays(
      today,
      hour >= 10
        ? 2
        : 1
    );

  const db =
    getDB();

  const result =
    await db
      .prepare(`
        SELECT
          b.id,
          b.code,
          b.check_in,
          b.check_out,
          b.guests,
          b.name,
          b.email
        FROM bookings b
        WHERE
          b.status =
            'confirmed'
          AND
          b.payment_status =
            'paid'
          AND
          b.check_in >= ?
          AND
          b.check_in <= ?
          AND
          b.email IS NOT NULL
          AND
          b.email <> ''
          AND NOT EXISTS (
            SELECT 1
            FROM booking_notifications n
            WHERE
              n.booking_id =
                b.id
              AND
              n.kind =
                'guest_prearrival_2d'
          )
        ORDER BY
          b.check_in ASC
      `)
      .bind(
        today,
        maxCheckIn
      )
      .all<BookingRow>();

  for (
    const booking
    of result.results ??
      []
  ) {
    try {
      await sendPreArrivalEmail(
        booking
      );
    } catch (
      error
    ) {
      console.error(
        `Pre-arrival fail-safe failed for ${booking.code}:`,
        error
      );
    }
  }
}

/*
 * POST-STAY
 *
 * Normal target:
 * checkout day from
 * 14:00 Athens time.
 *
 * Fail-safe:
 * if the 14:00 execution fails,
 * following hourly executions
 * retry it.
 *
 * We also allow a 7-day catch-up
 * window in case Cloudflare or
 * email delivery was unavailable
 * for a longer period.
 *
 * We intentionally do NOT scan
 * all historical bookings, so
 * an old customer will never
 * suddenly receive a review email
 * months later.
 */
async function runPostStayFailSafe() {
  const today =
    todayAthens();

  const hour =
    currentAthensHour();

  const latestDueCheckout =
    hour >= 14
      ? today
      : addDays(
          today,
          -1
        );

  const earliestDueCheckout =
    addDays(
      today,
      -7
    );

  const db =
    getDB();

  const result =
    await db
      .prepare(`
        SELECT
          b.id,
          b.code,
          b.check_in,
          b.check_out,
          b.guests,
          b.name,
          b.email
        FROM bookings b
        WHERE
          b.status =
            'confirmed'
          AND
          b.payment_status =
            'paid'
          AND
          b.check_out >= ?
          AND
          b.check_out <= ?
          AND
          b.email IS NOT NULL
          AND
          b.email <> ''
          AND NOT EXISTS (
            SELECT 1
            FROM booking_notifications n
            WHERE
              n.booking_id =
                b.id
              AND
              n.kind =
                'guest_poststay'
          )
        ORDER BY
          b.check_out ASC
      `)
      .bind(
        earliestDueCheckout,
        latestDueCheckout
      )
      .all<BookingRow>();

  for (
    const booking
    of result.results ??
      []
  ) {
    try {
      await sendPostStayEmail(
        booking
      );
    } catch (
      error
    ) {
      console.error(
        `Post-stay fail-safe failed for ${booking.code}:`,
        error
      );
    }
  }
}

export async function runEmailFailSafe() {
  await runPreArrivalFailSafe();

  await runPostStayFailSafe();
}
