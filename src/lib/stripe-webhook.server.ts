import { env } from "cloudflare:workers";
import { getDB } from "./d1.server";

import {
  sendBookingConfirmationEmails,
} from "./booking-email.server";

type StripeWebhookEnv = {
  STRIPE_WEBHOOK_SECRET?: string;
};

type StripeCheckoutSession = {
  id?: string;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string>;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeCheckoutSession;
  };
};

type BookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  rate: string;
  total: number;
  stripe_session_id:
    | string
    | null;
  status: string;
};

const textEncoder =
  new TextEncoder();

function timingSafeEqual(
  a: string,
  b: string
) {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    diff |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return diff === 0;
}

async function hmacSha256Hex(
  secret: string,
  payload: string
) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      textEncoder.encode(payload)
    );

  return Array.from(
    new Uint8Array(signature)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
) {
  const parts =
    signatureHeader
      .split(",")
      .map((part) =>
        part.trim()
      );

  const timestamp =
    parts
      .find((part) =>
        part.startsWith("t=")
      )
      ?.slice(2);

  const signatures =
    parts
      .filter((part) =>
        part.startsWith("v1=")
      )
      .map((part) =>
        part.slice(3)
      );

  if (
    !timestamp ||
    signatures.length === 0
  ) {
    return false;
  }

  const timestampNumber =
    Number(timestamp);

  if (
    !Number.isFinite(
      timestampNumber
    )
  ) {
    return false;
  }

  const ageSeconds =
    Math.abs(
      Math.floor(
        Date.now() / 1000
      ) -
        timestampNumber
    );

  if (ageSeconds > 300) {
    return false;
  }

  const expected =
    await hmacSha256Hex(
      secret,
      `${timestamp}.${rawBody}`
    );

  return signatures.some(
    (signature) =>
      timingSafeEqual(
        signature,
        expected
      )
  );
}

async function confirmPaidSession(
  session: StripeCheckoutSession
) {
  const sessionId =
    session.id;

  const bookingId =
    session.metadata?.booking_id;

  if (
    !sessionId ||
    !bookingId ||
    session.payment_status !==
      "paid" ||
    session.currency !== "eur" ||
    session.amount_total == null
  ) {
    return;
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
          name,
          email,
          phone,
          rate,
          total,
          stripe_session_id,
          status
        FROM bookings
        WHERE id = ?
        LIMIT 1
      `)
      .bind(bookingId)
      .first<BookingRow>();

  if (!booking) {
    return;
  }

  if (
    booking.stripe_session_id !==
      sessionId
  ) {
    return;
  }

  if (
    booking.total * 100 !==
      session.amount_total
  ) {
    return;
  }

  if (
    booking.status !==
    "confirmed"
  ) {
    await db
      .prepare(`
        UPDATE bookings
        SET
          status = 'confirmed',
          payment_status = 'paid',
          expires_at = NULL
        WHERE
          id = ?
          AND stripe_session_id = ?
      `)
      .bind(
        booking.id,
        sessionId
      )
      .run();
  }

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
}

export async function handleStripeWebhook(
  request: Request
) {
  const secret =
    (
      env as unknown as
        StripeWebhookEnv
    ).STRIPE_WEBHOOK_SECRET;

  if (
    !secret ||
    !secret.startsWith(
      "whsec_"
    )
  ) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is missing or invalid"
    );

    return new Response(
      "Webhook secret not configured",
      {
        status: 500,
      }
    );
  }

  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return new Response(
      "Missing Stripe signature",
      {
        status: 400,
      }
    );
  }

  const rawBody =
    await request.text();

  const valid =
    await verifyStripeSignature(
      rawBody,
      signature,
      secret
    );

  if (!valid) {
    return new Response(
      "Invalid Stripe signature",
      {
        status: 400,
      }
    );
  }

  let event: StripeEvent;

  try {
    event =
      JSON.parse(
        rawBody
      ) as StripeEvent;
  } catch {
    return new Response(
      "Invalid JSON",
      {
        status: 400,
      }
    );
  }

  if (
    event.type ===
      "checkout.session.completed" ||
    event.type ===
      "checkout.session.async_payment_succeeded"
  ) {
    const session =
      event.data?.object;

    if (session) {
      await confirmPaidSession(
        session
      );
    }
  }

  return new Response(
    "ok",
    {
      status: 200,
    }
  );
}
