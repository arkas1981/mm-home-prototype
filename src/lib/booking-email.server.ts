import { env } from "cloudflare:workers";
import { getDB } from "./d1.server";

type EmailEnv = {
  RESEND_API_KEY?: string;
};

type BookingEmail = {
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
};

function formatDate(
  iso: string
) {
  return new Date(
    `${iso}T12:00:00`
  ).toLocaleDateString(
    "el-GR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendOwnerBookingEmail(
  booking: BookingEmail
) {
  const db = getDB();

  const claim =
    await db
      .prepare(`
        INSERT OR IGNORE
        INTO booking_notifications (
          booking_id,
          kind
        )
        VALUES (?, 'owner_paid_booking')
      `)
      .bind(
        booking.id
      )
      .run();

  if (
    !claim.meta.changes
  ) {
    return;
  }

  const apiKey =
    (
      env as unknown as
        EmailEnv
    ).RESEND_API_KEY;

  if (
    !apiKey ||
    !apiKey.startsWith("re_")
  ) {
    await db
      .prepare(`
        DELETE FROM booking_notifications
        WHERE
          booking_id = ?
          AND kind =
            'owner_paid_booking'
      `)
      .bind(
        booking.id
      )
      .run();

    throw new Error(
      "RESEND_API_KEY missing or invalid"
    );
  }

  const rate =
    booking.rate ===
    "flexible"
      ? "Ευέλικτη"
      : "Μη επιστρέψιμη";

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 620px;
      margin: 0 auto;
      color: #2d2926;
      line-height: 1.6;
    ">
      <h2 style="
        margin-bottom: 4px;
      ">
        Νέα πληρωμένη κράτηση — MM Home
      </h2>

      <p style="
        color: #8a6a3f;
        font-size: 18px;
        margin-top: 0;
      ">
        ${escapeHtml(booking.code)}
      </p>

      <table style="
        width: 100%;
        border-collapse: collapse;
      ">
        <tr>
          <td style="padding:8px 0;"><strong>Επισκέπτης</strong></td>
          <td style="padding:8px 0;">${escapeHtml(booking.name)}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Email</strong></td>
          <td style="padding:8px 0;">${escapeHtml(booking.email)}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Τηλέφωνο</strong></td>
          <td style="padding:8px 0;">${escapeHtml(booking.phone)}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Άφιξη</strong></td>
          <td style="padding:8px 0;">${formatDate(booking.check_in)}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Αναχώρηση</strong></td>
          <td style="padding:8px 0;">${formatDate(booking.check_out)}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Επισκέπτες</strong></td>
          <td style="padding:8px 0;">${booking.guests}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Τιμή</strong></td>
          <td style="padding:8px 0;">${rate}</td>
        </tr>

        <tr>
          <td style="padding:8px 0;"><strong>Σύνολο</strong></td>
          <td style="padding:8px 0;"><strong>€${booking.total}</strong></td>
        </tr>
      </table>

      <p style="
        margin-top: 28px;
      ">
        <a
          href="https://mmhome.gr/admin"
          style="
            display:inline-block;
            padding:12px 20px;
            border-radius:6px;
            background:#8a6a3f;
            color:white;
            text-decoration:none;
          "
        >
          Άνοιγμα διαχείρισης MM Home
        </a>
      </p>

      <p style="
        margin-top: 30px;
        color: #777;
        font-size: 12px;
      ">
        Αυτόματο μήνυμα από το σύστημα κρατήσεων του MM Home.
      </p>
    </div>
  `;

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
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
              "info@mmhome.gr",
            ],
            subject:
              `Νέα κράτηση MM Home · ${booking.code}`,
            html,
          }),
      }
    );

  if (!response.ok) {
    const body =
      await response.text();

    await db
      .prepare(`
        DELETE FROM booking_notifications
        WHERE
          booking_id = ?
          AND kind =
            'owner_paid_booking'
      `)
      .bind(
        booking.id
      )
      .run();

    console.error(
      "Resend error:",
      body
    );

    throw new Error(
      "Could not send booking email"
    );
  }
}
