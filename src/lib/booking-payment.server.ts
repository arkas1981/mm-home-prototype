import { env } from "cloudflare:workers";
import { getDB } from "./d1.server";

import {
  sendBookingConfirmationEmails,
} from "./booking-email.server";

import {
  BASE_RATE,
  DEFAULT_MIN_NIGHTS,
  LEAD_DAYS,
  MAX_GUESTS,
  NONREF_DISCOUNT,
  type RateType,
} from "./booking";

type StripeEnv = {
  STRIPE_SECRET_KEY?: string;
};

type OverrideRow = {
  start_date: string;
  end_date: string;
  price: number | null;
  min_nights: number | null;
};

type CheckoutInput = {
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  rate: RateType;
  adult: boolean;
  terms: boolean;
  nonrefAck: boolean;
  expectedTotal: number;
};

type BookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  rate: string;
  total: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  stripe_session_id:
    | string
    | null;
};

const addDays = (
  date: string,
  days: number
) => {
  const d = new Date(
    `${date}T12:00:00Z`
  );

  d.setUTCDate(
    d.getUTCDate() + days
  );

  return d
    .toISOString()
    .slice(0, 10);
};

const diffDays = (
  a: string,
  b: string
) => {
  const start =
    new Date(
      `${a}T12:00:00Z`
    );

  const end =
    new Date(
      `${b}T12:00:00Z`
    );

  return Math.round(
    (end.getTime() -
      start.getTime()) /
      86400000
  );
};

const nightsOf = (
  checkIn: string,
  checkOut: string
) => {
  const dates: string[] =
    [];

  for (
    let d = checkIn;
    d < checkOut;
    d = addDays(d, 1)
  ) {
    dates.push(d);
  }

  return dates;
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

function overrideFor(
  date: string,
  overrides: OverrideRow[],
  key:
    | "price"
    | "min_nights"
) {
  return [...overrides]
    .reverse()
    .find(
      (o) =>
        o[key] != null &&
        date >=
          o.start_date &&
        date <=
          o.end_date
    )?.[key];
}

function genCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "MM-";

  for (
    let i = 0;
    i < 6;
    i++
  ) {
    code +=
      chars[
        Math.floor(
          Math.random() *
            chars.length
        )
      ];
  }

  return code;
}

async function getCurrentQuote(
  checkIn: string,
  checkOut: string,
  rate: RateType
) {
  const db = getDB();

  const rows =
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
    rows.results ?? [];

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
    nightsOf(
      checkIn,
      checkOut
    );

  const total =
    nights.reduce(
      (sum, date) => {
        const flexible =
          (overrideFor(
            date,
            overrides,
            "price"
          ) as
            | number
            | null
            | undefined) ??
          BASE_RATE;

        const price =
          rate ===
          "flexible"
            ? flexible
            : Math.round(
                flexible *
                  (1 -
                    NONREF_DISCOUNT)
              );

        return sum + price;
      },
      0
    );

  return {
    minNights,
    nights:
      nights.length,
    total,
  };
}

/*
 * MM HOME AVAILABILITY RULE
 *
 * Checkout date is available
 * for a new guest check-in.
 *
 * Example:
 *
 * Existing booking:
 * 18 -> 20 October
 *
 * Occupied nights:
 * 18 and 19 October
 *
 * Checkout:
 * 20 October at 11:00
 *
 * New guest may check in:
 * 20 October at 15:00
 */
async function datesTaken(
  checkIn: string,
  checkOut: string
) {
  const db = getDB();

  const now =
    new Date().toISOString();

  await db
    .prepare(`
      DELETE FROM bookings
      WHERE
        status = 'pending'
        AND expires_at IS NOT NULL
        AND expires_at <= ?
    `)
    .bind(now)
    .run();

  /*
   * Two bookings overlap only if:
   *
   * existing check-in < new check-out
   * AND
   * existing check-out > new check-in
   *
   * So:
   * existing checkout = new check-in
   * is allowed.
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
            status = 'confirmed'
            OR (
              status = 'pending'
              AND expires_at IS NOT NULL
              AND expires_at > ?
            )
          )
          AND check_in < ?
          AND check_out > ?
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
    return true;
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

  return !!block;
}

function stripeKey() {
  const key =
    (
      env as unknown as
        StripeEnv
    ).STRIPE_SECRET_KEY;

  if (
    !key ||
    !(
      key.startsWith(
        "sk_test_"
      ) ||
      key.startsWith(
        "sk_live_"
      ) ||
      key.startsWith(
        "rk_live_"
      )
    )
  ) {
    throw new Error(
      "Stripe secret key missing or invalid"
    );
  }

  return key;
}

async function createStripeSession(
  params:
    Record<
      string,
      string
    >
) {
  const response =
    await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${stripeKey()}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          new URLSearchParams(
            params
          ).toString(),
      }
    );

  const json =
    (await response.json()) as {
      id?: string;
      url?: string;
      error?: {
        message?: string;
      };
    };

  if (
    !response.ok ||
    !json.id ||
    !json.url
  ) {
    throw new Error(
      json.error?.message ??
        "Stripe checkout failed"
    );
  }

  return {
    id: json.id,
    url: json.url,
  };
}

async function getStripeSession(
  sessionId: string
) {
  const response =
    await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
        sessionId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${stripeKey()}`,
        },
      }
    );

  const json =
    (await response.json()) as {
      id?: string;
      payment_status?: string;
      amount_total?:
        | number
        | null;
      currency?:
        | string
        | null;
      metadata?:
        Record<
          string,
          string
        >;
      error?: {
        message?: string;
      };
    };

  if (
    !response.ok ||
    !json.id
  ) {
    throw new Error(
      json.error?.message ??
        "Stripe verification failed"
    );
  }

  return json;
}

async function notifyBooking(
  booking: BookingRow
) {
  try {
    await sendBookingConfirmationEmails({
      id:
        booking.id,
      code:
        booking.code,
      check_in:
        booking.check_in,
      check_out:
        booking.check_out,
      guests:
        booking.guests,
      name:
        booking.name,
      email:
        booking.email,
      phone:
        booking.phone,
      rate:
        booking.rate,
      total:
        booking.total,
    });
  } catch (error) {
    console.error(
      "Booking confirmation email failed:",
      error
    );
  }
}

export async function startCheckout(
  input: CheckoutInput
) {
  const {
    checkIn,
    checkOut,
    guests,
    rate,
  } = input;

  const name =
    input.name
      .trim()
      .slice(0, 100);

  const email =
    input.email
      .trim()
      .toLowerCase()
      .slice(0, 255);

  const phone =
    input.phone
      .trim()
      .slice(0, 30);

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
      error:
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
      error:
        "invalid" as const,
    };
  }

  if (
    rate !== "flexible" &&
    rate !== "nonref"
  ) {
    return {
      error:
        "invalid" as const,
    };
  }

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    ) ||
    phone.replace(
      /\D/g,
      ""
    ).length < 8
  ) {
    return {
      error:
        "invalid" as const,
    };
  }

  if (
    !input.adult ||
    !input.terms ||
    (
      rate === "nonref" &&
      !input.nonrefAck
    )
  ) {
    return {
      error:
        "terms" as const,
    };
  }

  if (
    diffDays(
      todayAthens(),
      checkIn
    ) < LEAD_DAYS
  ) {
    return {
      error:
        "lead" as const,
    };
  }

  const quote =
    await getCurrentQuote(
      checkIn,
      checkOut,
      rate
    );

  if (
    quote.nights <
    quote.minNights
  ) {
    return {
      error:
        "min" as const,
      minNights:
        quote.minNights,
    };
  }

  if (
    await datesTaken(
      checkIn,
      checkOut
    )
  ) {
    return {
      error:
        "taken" as const,
    };
  }

  if (
    quote.total !==
    Math.round(
      input.expectedTotal
    )
  ) {
    return {
      error:
        "price_changed" as const,
    };
  }

  const db = getDB();

  const id =
    crypto.randomUUID();

  const code =
    genCode();

  const expiresAt =
    new Date(
      Date.now() +
        30 *
          60 *
          1000
    ).toISOString();

  await db
    .prepare(`
      INSERT INTO bookings (
        id,
        code,
        check_in,
        check_out,
        guests,
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
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'pending',
        'unpaid',
        'web',
        ?
      )
    `)
    .bind(
      id,
      code,
      checkIn,
      checkOut,
      guests,
      name,
      email,
      phone,
      rate,
      quote.total,
      expiresAt
    )
    .run();

  try {
    const session =
      await createStripeSession({
        mode:
          "payment",

        success_url:
          "https://mmhome.gr/book-success?session_id={CHECKOUT_SESSION_ID}",

        cancel_url:
          "https://mmhome.gr/book?cancelled=1",

        customer_email:
          email,

        "line_items[0][quantity]":
          "1",

        "line_items[0][price_data][currency]":
          "eur",

        "line_items[0][price_data][unit_amount]":
          String(
            quote.total *
              100
          ),

        "line_items[0][price_data][product_data][name]":
          `MM Home · ${checkIn} → ${checkOut} · ${quote.nights} nights`,

        "metadata[booking_id]":
          id,

        "metadata[booking_code]":
          code,
      });

    await db
      .prepare(`
        UPDATE bookings
        SET
          stripe_session_id = ?
        WHERE id = ?
      `)
      .bind(
        session.id,
        id
      )
      .run();

    return {
      url:
        session.url,
    };
  } catch (error) {
    await db
      .prepare(`
        DELETE FROM bookings
        WHERE
          id = ?
          AND status =
            'pending'
      `)
      .bind(id)
      .run();

    throw error;
  }
}

export async function confirmCheckout(
  sessionId: string
) {
  if (
    !/^cs_(test|live)_[A-Za-z0-9_]+$/.test(
      sessionId
    )
  ) {
    return {
      error:
        "invalid" as const,
    };
  }

  const session =
    await getStripeSession(
      sessionId
    );

  const bookingId =
    session.metadata?.[
      "booking_id"
    ];

  if (!bookingId) {
    return {
      error:
        "invalid" as const,
    };
  }

  const db = getDB();

  const booking =
    await db
      .prepare(`
        SELECT
          id,
          code,
          check_in,
          check_out,
          guests,
          rate,
          total,
          name,
          email,
          phone,
          status,
          stripe_session_id
        FROM bookings
        WHERE id = ?
      `)
      .bind(
        bookingId
      )
      .first<BookingRow>();

  if (
    !booking ||
    booking.stripe_session_id !==
      sessionId
  ) {
    return {
      error:
        "invalid" as const,
    };
  }

  if (
    booking.status ===
    "confirmed"
  ) {
    await notifyBooking(
      booking
    );

    return {
      booking: {
        code:
          booking.code,
        check_in:
          booking.check_in,
        check_out:
          booking.check_out,
        guests:
          booking.guests,
        rate:
          booking.rate,
        total:
          booking.total,
        name:
          booking.name,
      },
    };
  }

  if (
    session.payment_status !==
      "paid"
  ) {
    return {
      error:
        "unpaid" as const,
    };
  }

  if (
    session.currency !==
      "eur" ||
    session.amount_total !==
      booking.total * 100
  ) {
    return {
      error:
        "invalid" as const,
    };
  }

  await db
    .prepare(`
      UPDATE bookings
      SET
        status =
          'confirmed',
        payment_status =
          'paid',
        expires_at = NULL
      WHERE
        id = ?
        AND status =
          'pending'
    `)
    .bind(
      booking.id
    )
    .run();

  await notifyBooking(
    booking
  );

  return {
    booking: {
      code:
        booking.code,
      check_in:
        booking.check_in,
      check_out:
        booking.check_out,
      guests:
        booking.guests,
      rate:
        booking.rate,
      total:
        booking.total,
      name:
        booking.name,
    },
  };
}
