import { env } from "cloudflare:workers";
import { getDB } from "./d1.server";

type EmailEnv = {
  RESEND_API_KEY?: string;
};

export type BookingEmail = {
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
  iso: string,
  locale = "el-GR"
) {
  return new Date(
    `${iso}T12:00:00`
  ).toLocaleDateString(
    locale,
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

function getApiKey() {
  const apiKey =
    (
      env as unknown as
        EmailEnv
    ).RESEND_API_KEY;

  if (
    !apiKey ||
    !apiKey.startsWith("re_")
  ) {
    throw new Error(
      "RESEND_API_KEY missing or invalid"
    );
  }

  return apiKey;
}

async function claimNotification(
  bookingId: string,
  kind: string
) {
  const db = getDB();

  const result =
    await db
      .prepare(`
        INSERT OR IGNORE
        INTO booking_notifications (
          booking_id,
          kind
        )
        VALUES (?, ?)
      `)
      .bind(
        bookingId,
        kind
      )
      .run();

  return Boolean(
    result.meta.changes
  );
}

async function releaseNotification(
  bookingId: string,
  kind: string
) {
  const db = getDB();

  await db
    .prepare(`
      DELETE FROM booking_notifications
      WHERE
        booking_id = ?
        AND kind = ?
    `)
    .bind(
      bookingId,
      kind
    )
    .run();
}

async function sendEmail(
  data: {
    to: string;
    subject: string;
    html: string;
  }
) {
  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${getApiKey()}`,
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            from:
              "MM Home <info@mmhome.gr>",
            to: [
              data.to,
            ],
            reply_to:
              "info@mmhome.gr",
            subject:
              data.subject,
            html:
              data.html,
          }),
      }
    );

  if (!response.ok) {
    const body =
      await response.text();

    console.error(
      "Resend error:",
      body
    );

    throw new Error(
      "Could not send email"
    );
  }
}

export async function sendOwnerBookingEmail(
  booking: BookingEmail
) {
  const kind =
    "owner_paid_booking";

  const claimed =
    await claimNotification(
      booking.id,
      kind
    );

  if (!claimed) {
    return;
  }

  try {
    const rate =
      booking.rate ===
      "flexible"
        ? "Ευέλικτη"
        : "Μη επιστρέψιμη";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:620px;
        margin:0 auto;
        color:#2d2926;
        line-height:1.6;
      ">
        <h2>
          Νέα πληρωμένη κράτηση — MM Home
        </h2>

        <p style="
          color:#8a6a3f;
          font-size:20px;
          font-weight:bold;
        ">
          ${escapeHtml(booking.code)}
        </p>

        <table style="
          width:100%;
          border-collapse:collapse;
        ">
          <tr>
            <td style="padding:8px 0;"><strong>Επισκέπτης</strong></td>
            <td>${escapeHtml(booking.name)}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Email</strong></td>
            <td>${escapeHtml(booking.email)}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Τηλέφωνο</strong></td>
            <td>${escapeHtml(booking.phone)}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Άφιξη</strong></td>
            <td>${formatDate(booking.check_in)}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Αναχώρηση</strong></td>
            <td>${formatDate(booking.check_out)}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Επισκέπτες</strong></td>
            <td>${booking.guests}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Τιμή</strong></td>
            <td>${rate}</td>
          </tr>

          <tr>
            <td style="padding:8px 0;"><strong>Σύνολο</strong></td>
            <td><strong>€${booking.total}</strong></td>
          </tr>
        </table>

        <p style="margin-top:28px;">
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
          margin-top:30px;
          color:#777;
          font-size:12px;
        ">
          Αυτόματο μήνυμα από το σύστημα κρατήσεων του MM Home.
        </p>
      </div>
    `;

    await sendEmail({
      to:
        "info@mmhome.gr",
      subject:
        `Νέα κράτηση MM Home · ${booking.code}`,
      html,
    });
  } catch (error) {
    await releaseNotification(
      booking.id,
      kind
    );

    throw error;
  }
}

export async function sendGuestBookingEmail(
  booking: BookingEmail
) {
  const kind =
    "guest_booking_confirmation";

  const claimed =
    await claimNotification(
      booking.id,
      kind
    );

  if (!claimed) {
    return;
  }

  try {
    const rateEl =
      booking.rate ===
      "flexible"
        ? "Ευέλικτη τιμή"
        : "Μη επιστρέψιμη τιμή";

    const rateEn =
      booking.rate ===
      "flexible"
        ? "Flexible rate"
        : "Non-refundable rate";

    const name =
      escapeHtml(
        booking.name
      );

    const code =
      escapeHtml(
        booking.code
      );

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:640px;
        margin:0 auto;
        color:#2d2926;
        line-height:1.65;
      ">

        <div style="
          text-align:center;
          padding:24px 10px;
          border-bottom:1px solid #e8e1d7;
        ">
          <div style="
            font-size:28px;
            font-weight:bold;
            color:#8a6a3f;
          ">
            MM Home
          </div>

          <div style="
            margin-top:4px;
            font-style:italic;
            color:#777;
          ">
            Your Home Away From Home
          </div>
        </div>

        <div style="padding:28px 10px;">

          <h2 style="
            margin-top:0;
            text-align:center;
          ">
            Η κράτησή σας επιβεβαιώθηκε
          </h2>

          <p>
            Αγαπητέ/ή ${name},
          </p>

          <p>
            Σας ευχαριστούμε που επιλέξατε το MM Home.
            Η πληρωμή σας ολοκληρώθηκε και η κράτησή σας
            έχει επιβεβαιωθεί.
          </p>

          <div style="
            text-align:center;
            background:#f7f4ef;
            padding:18px;
            margin:24px 0;
            border-radius:8px;
          ">
            <div style="
              font-size:12px;
              color:#777;
              text-transform:uppercase;
            ">
              Κωδικός κράτησης
            </div>

            <div style="
              font-size:28px;
              font-weight:bold;
              color:#8a6a3f;
              margin-top:4px;
            ">
              ${code}
            </div>
          </div>

          <table style="
            width:100%;
            border-collapse:collapse;
          ">
            <tr>
              <td style="padding:8px 0;"><strong>Άφιξη</strong></td>
              <td style="text-align:right;">
                ${formatDate(booking.check_in)}
                · από 15:00
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Αναχώρηση</strong></td>
              <td style="text-align:right;">
                ${formatDate(booking.check_out)}
                · έως 11:00
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Επισκέπτες</strong></td>
              <td style="text-align:right;">
                ${booking.guests}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Τιμή</strong></td>
              <td style="text-align:right;">
                ${rateEl}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Πληρωμένο σύνολο</strong></td>
              <td style="text-align:right;">
                <strong>€${booking.total}</strong>
              </td>
            </tr>
          </table>

          <div style="
            margin-top:24px;
            padding:18px;
            background:#f7f4ef;
            border-radius:8px;
          ">
            <strong>MM Home</strong><br>
            Ασκληπιού 44, Τρίκαλα<br>
            Τηλ. / Viber:
            +30 698 468 4411<br>
            info@mmhome.gr
          </div>

          <p style="margin-top:24px;">
            Το check-in πραγματοποιείται προσωπικά.
            Κατά την άφιξη θα ζητηθεί ταυτότητα ή διαβατήριο.
          </p>

          <hr style="
            border:0;
            border-top:1px solid #e8e1d7;
            margin:34px 0;
          ">

          <h2 style="text-align:center;">
            Your booking is confirmed
          </h2>

          <p>
            Dear ${name},
          </p>

          <p>
            Thank you for choosing MM Home.
            Your payment has been completed and your
            reservation is confirmed.
          </p>

          <table style="
            width:100%;
            border-collapse:collapse;
          ">
            <tr>
              <td style="padding:8px 0;"><strong>Booking code</strong></td>
              <td style="text-align:right;">${code}</td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Check-in</strong></td>
              <td style="text-align:right;">
                ${formatDate(
                  booking.check_in,
                  "en-GB"
                )}
                · from 15:00
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Check-out</strong></td>
              <td style="text-align:right;">
                ${formatDate(
                  booking.check_out,
                  "en-GB"
                )}
                · by 11:00
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Guests</strong></td>
              <td style="text-align:right;">
                ${booking.guests}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Rate</strong></td>
              <td style="text-align:right;">
                ${rateEn}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;"><strong>Total paid</strong></td>
              <td style="text-align:right;">
                <strong>€${booking.total}</strong>
              </td>
            </tr>
          </table>

          <p style="margin-top:24px;">
            Personal check-in is available from 15:00.
            An ID card or passport will be requested upon arrival.
          </p>

          <p style="
            margin-top:34px;
            text-align:center;
          ">
            MM Home<br>
            <span style="color:#777;">
              Your Home Away From Home
            </span>
          </p>

        </div>
      </div>
    `;

    await sendEmail({
      to:
        booking.email,
      subject:
        `Η κράτησή σας στο MM Home επιβεβαιώθηκε · ${booking.code}`,
      html,
    });
  } catch (error) {
    await releaseNotification(
      booking.id,
      kind
    );

    throw error;
  }
}

export async function sendBookingConfirmationEmails(
  booking: BookingEmail
) {
  await sendOwnerBookingEmail(
    booking
  );

  await sendGuestBookingEmail(
    booking
  );
}
