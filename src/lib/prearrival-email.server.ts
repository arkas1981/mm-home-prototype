import { env } from "cloudflare:workers";
import { getDB } from "./d1.server";

type EmailEnv = {
  RESEND_API_KEY?: string;
};

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
  const d =
    new Date(
      `${date}T12:00:00Z`
    );

  d.setUTCDate(
    d.getUTCDate() +
      days
  );

  return d
    .toISOString()
    .slice(0, 10);
}

function formatDate(
  iso: string,
  locale:
    | "el-GR"
    | "en-GB"
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

function resendKey() {
  const key =
    (
      env as unknown as
        EmailEnv
    ).RESEND_API_KEY;

  if (
    !key ||
    !key.startsWith(
      "re_"
    )
  ) {
    throw new Error(
      "RESEND_API_KEY missing or invalid"
    );
  }

  return key;
}

async function claim(
  bookingId: string
) {
  const db =
    getDB();

  const result =
    await db
      .prepare(`
        INSERT OR IGNORE
        INTO booking_notifications (
          booking_id,
          kind
        )
        VALUES (
          ?,
          'guest_prearrival_2d'
        )
      `)
      .bind(
        bookingId
      )
      .run();

  return Boolean(
    result.meta.changes
  );
}

async function release(
  bookingId: string
) {
  const db =
    getDB();

  await db
    .prepare(`
      DELETE FROM booking_notifications
      WHERE
        booking_id = ?
        AND kind =
          'guest_prearrival_2d'
    `)
    .bind(
      bookingId
    )
    .run();
}

async function sendPreArrivalEmail(
  booking: BookingRow
) {
  const claimed =
    await claim(
      booking.id
    );

  if (!claimed) {
    return;
  }

  try {
    const name =
      escapeHtml(
        booking.name
      );

    const code =
      escapeHtml(
        booking.code
      );

    const directionsUrl =
      "https://www.google.com/maps/dir/?api=1&destination=39.550449832990786%2C21.765204641597695";

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

        <div style="
          padding:28px 10px;
        ">

          <h2 style="
            text-align:center;
            margin-top:0;
          ">
            Η διαμονή σας στο MM Home πλησιάζει
          </h2>

          <p>
            Αγαπητέ/ή ${name},
          </p>

          <p>
            Χαιρόμαστε που σύντομα θα σας υποδεχτούμε
            στο <strong>MM Home</strong> στα Τρίκαλα!
          </p>

          <div style="
            background:#f7f4ef;
            padding:20px;
            border-radius:8px;
            margin:24px 0;
          ">
            <strong>Κωδικός κράτησης:</strong>
            ${code}<br><br>

            <strong>Άφιξη:</strong>
            ${formatDate(
              booking.check_in,
              "el-GR"
            )}
            — check-in από τις 15:00
            <br>

            <strong>Αναχώρηση:</strong>
            ${formatDate(
              booking.check_out,
              "el-GR"
            )}
            — check-out έως τις 11:00
            <br>

            <strong>Επισκέπτες:</strong>
            ${booking.guests}
          </div>

          <p>
            📍 <strong>MM Home</strong><br>
            Ασκληπιού 44, Τρίκαλα
          </p>

          <p style="
            text-align:center;
            margin:26px 0;
          ">
            <a
              href="${directionsUrl}"
              style="
                display:inline-block;
                padding:13px 22px;
                background:#8a6a3f;
                color:#ffffff;
                text-decoration:none;
                border-radius:7px;
                font-weight:bold;
              "
            >
              Οδηγίες μετάβασης
            </a>
          </p>

          <p>
            Η στάθμευση γίνεται στον δρόμο
            και συνήθως είναι εύκολη.
          </p>

          <p>
            Καθώς το check-in πραγματοποιείται προσωπικά,
            θα μας βοηθούσε να μας ενημερώσετε για την
            <strong>περίπου ώρα άφιξής σας</strong>,
            ώστε να είμαστε έτοιμοι να σας υποδεχτούμε.
          </p>

          <p>
            Κατά την άφιξη θα χρειαστεί η επίδειξη
            ταυτότητας ή διαβατηρίου του κύριου επισκέπτη.
          </p>

          <p>
            Για οτιδήποτε χρειαστείτε πριν ή κατά τη
            διάρκεια της διαμονής σας:
          </p>

          <p>
            <strong>Τηλέφωνο / Viber:</strong>
            +30 698 468 4411<br>

            <strong>Email:</strong>
            info@mmhome.gr
          </p>

          <p>
            Σας ευχόμαστε καλό ταξίδι και ανυπομονούμε
            να σας καλωσορίσουμε!
          </p>

          <hr style="
            border:0;
            border-top:1px solid #e8e1d7;
            margin:34px 0;
          ">

          <h2 style="
            text-align:center;
          ">
            Your stay at MM Home is coming soon
          </h2>

          <p>
            Dear ${name},
          </p>

          <p>
            We are looking forward to welcoming you
            to <strong>MM Home</strong> in Trikala.
          </p>

          <p>
            <strong>Booking code:</strong>
            ${code}<br>

            <strong>Check-in:</strong>
            ${formatDate(
              booking.check_in,
              "en-GB"
            )}
            — from 15:00<br>

            <strong>Check-out:</strong>
            ${formatDate(
              booking.check_out,
              "en-GB"
            )}
            — by 11:00
          </p>

          <p style="
            text-align:center;
            margin:26px 0;
          ">
            <a
              href="${directionsUrl}"
              style="
                display:inline-block;
                padding:13px 22px;
                background:#8a6a3f;
                color:#ffffff;
                text-decoration:none;
                border-radius:7px;
                font-weight:bold;
              "
            >
              Directions to MM Home
            </a>
          </p>

          <p>
            Street parking is available and is
            usually easy to find.
          </p>

          <p>
            As check-in is personal, please let us know
            your <strong>approximate arrival time</strong>
            so that we can be ready to welcome you.
          </p>

          <p>
            The main guest will be asked to present
            an ID card or passport upon arrival.
          </p>

          <p>
            Phone / Viber:
            +30 698 468 4411<br>
            Email:
            info@mmhome.gr
          </p>

          <p style="
            margin-top:32px;
            text-align:center;
          ">
            <strong>MM Home</strong><br>
            <span style="
              color:#777;
              font-style:italic;
            ">
              Your Home Away From Home
            </span>
          </p>

        </div>
      </div>
    `;

    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${resendKey()}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              from:
                "MM Home <info@mmhome.gr>",

              to: [
                booking.email,
              ],

              reply_to:
                "info@mmhome.gr",

              subject:
                `Η διαμονή σας στο MM Home πλησιάζει · ${booking.code}`,

              html,
            }),
        }
      );

    if (
      !response.ok
    ) {
      const body =
        await response.text();

      console.error(
        "Pre-arrival email error:",
        body
      );

      throw new Error(
        "Could not send pre-arrival email"
      );
    }
  } catch (
    error
  ) {
    await release(
      booking.id
    );

    throw error;
  }
}

export async function runPreArrivalEmails() {
  /*
   * Το cron τρέχει κάθε ώρα.
   * Στέλνουμε μόνο όταν στην Ελλάδα είναι 10:00.
   */
  if (
    currentAthensHour() !==
    10
  ) {
    return;
  }

  const today =
    todayAthens();

  const targetDate =
    addDays(
      today,
      2
    );

  const db =
    getDB();

  const result =
    await db
      .prepare(`
        SELECT
          id,
          code,
          check_in,
          check_out,
          guests,
          name,
          email
        FROM bookings
        WHERE
          status = 'confirmed'
          AND payment_status = 'paid'
          AND check_in = ?
          AND email IS NOT NULL
          AND email <> ''
      `)
      .bind(
        targetDate
      )
      .all<BookingRow>();

  for (
    const booking
    of result.results ?? []
  ) {
    try {
      await sendPreArrivalEmail(
        booking
      );
    } catch (
      error
    ) {
      console.error(
        `Pre-arrival email failed for ${booking.code}:`,
        error
      );
    }
  }
}
