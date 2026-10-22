import { env } from "cloudflare:workers";
import { getDB } from "./d1.server";

import logoAsset from "@/assets/mmhome-logo.png";
import heroAsset from "@/assets/living-primary.png";

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

const SITE_URL =
  "https://mmhome.gr";

const LOGO_URL =
  `${SITE_URL}${logoAsset.startsWith("/") ? "" : "/"}${logoAsset}`;

const HERO_URL =
  `${SITE_URL}${heroAsset.startsWith("/") ? "" : "/"}${heroAsset}`;

const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=39.550449832990786%2C21.765204641597695";

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

function buildEmailHtml(
  booking: BookingRow
) {
  const name =
    escapeHtml(
      booking.name
    );

  const code =
    escapeHtml(
      booking.code
    );

  const checkInEl =
    formatDate(
      booking.check_in,
      "el-GR"
    );

  const checkOutEl =
    formatDate(
      booking.check_out,
      "el-GR"
    );

  const checkInEn =
    formatDate(
      booking.check_in,
      "en-GB"
    );

  const checkOutEn =
    formatDate(
      booking.check_out,
      "en-GB"
    );

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >
  <title>
    MM Home
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f6f3ee;
    font-family:Arial,Helvetica,sans-serif;
    color:#2f2a25;
  "
>
  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      width:100%;
      background:#f6f3ee;
      padding:24px 10px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="640"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            max-width:640px;
            background:#ffffff;
            border-radius:14px;
            overflow:hidden;
            border:1px solid #e9e1d6;
          "
        >

          <!-- LOGO -->
          <tr>
            <td
              align="center"
              style="
                padding:26px 20px 20px;
                background:#fffdf9;
              "
            >
              <img
                src="${LOGO_URL}"
                alt="MM Home"
                width="120"
                style="
                  display:block;
                  width:120px;
                  max-width:120px;
                  height:auto;
                  border:0;
                "
              >

              <div
                style="
                  margin-top:8px;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:14px;
                  font-style:italic;
                  color:#857565;
                "
              >
                Your Home Away From Home
              </div>
            </td>
          </tr>

          <!-- HERO PHOTO -->
          <tr>
            <td
              style="
                padding:0;
              "
            >
              <img
                src="${HERO_URL}"
                alt="MM Home"
                width="640"
                style="
                  display:block;
                  width:100%;
                  max-width:640px;
                  height:auto;
                  border:0;
                "
              >
            </td>
          </tr>

          <!-- GREEK -->
          <tr>
            <td
              style="
                padding:30px 28px 10px;
              "
            >

              <div
                style="
                  text-align:center;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:28px;
                  line-height:1.2;
                  color:#7a592e;
                  font-weight:bold;
                "
              >
                Η διαμονή σας στο MM Home πλησιάζει
              </div>

              <p
                style="
                  margin:26px 0 10px;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                Αγαπητέ/ή ${name},
              </p>

              <p
                style="
                  margin:0 0 22px;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Χαιρόμαστε που σύντομα θα σας
                υποδεχτούμε στο
                <strong>MM Home</strong>
                στα Τρίκαλα!
              </p>

              <!-- BOOKING CARD -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  background:#f7f3ec;
                  border-radius:10px;
                  margin:0 0 26px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:18px 20px;
                    "
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          style="
                            padding:5px 0;
                            color:#766858;
                            font-size:13px;
                          "
                        >
                          Κωδικός κράτησης
                        </td>

                        <td
                          align="right"
                          style="
                            padding:5px 0;
                            font-size:15px;
                            font-weight:bold;
                          "
                        >
                          ${code}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:8px 0;
                            color:#766858;
                            font-size:13px;
                          "
                        >
                          Άφιξη
                        </td>

                        <td
                          align="right"
                          style="
                            padding:8px 0;
                            font-size:15px;
                          "
                        >
                          <strong>
                            ${checkInEl}
                          </strong>
                          <br>
                          <span
                            style="
                              color:#766858;
                              font-size:13px;
                            "
                          >
                            check-in από τις 15:00
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:8px 0;
                            color:#766858;
                            font-size:13px;
                          "
                        >
                          Αναχώρηση
                        </td>

                        <td
                          align="right"
                          style="
                            padding:8px 0;
                            font-size:15px;
                          "
                        >
                          <strong>
                            ${checkOutEl}
                          </strong>
                          <br>
                          <span
                            style="
                              color:#766858;
                              font-size:13px;
                            "
                          >
                            check-out έως τις 11:00
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:8px 0;
                            color:#766858;
                            font-size:13px;
                          "
                        >
                          Επισκέπτες
                        </td>

                        <td
                          align="right"
                          style="
                            padding:8px 0;
                            font-size:15px;
                            font-weight:bold;
                          "
                        >
                          ${booking.guests}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- LOCATION -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  margin-bottom:20px;
                "
              >
                <tr>
                  <td
                    style="
                      width:38px;
                      vertical-align:top;
                      font-size:22px;
                    "
                  >
                    📍
                  </td>

                  <td
                    style="
                      font-size:15px;
                      line-height:1.6;
                    "
                  >
                    <strong>
                      MM Home
                    </strong>
                    <br>
                    Ασκληπιού 44, Τρίκαλα
                  </td>
                </tr>
              </table>

              <!-- DIRECTIONS BUTTON -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin:0 0 28px;
                "
              >
                <tr>
                  <td align="center">

                    <table
                      role="presentation"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          bgcolor="#8a642f"
                          style="
                            border-radius:8px;
                          "
                        >
                          <a
                            href="${DIRECTIONS_URL}"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:14px 26px;
                              font-size:15px;
                              line-height:1;
                              color:#ffffff;
                              text-decoration:none;
                              font-weight:bold;
                            "
                          >
                            📍 Οδηγίες μετάβασης
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- INFO BOX -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  border-top:1px solid #eadfce;
                  border-bottom:1px solid #eadfce;
                  margin-bottom:24px;
                "
              >

                <tr>
                  <td
                    style="
                      padding:15px 4px;
                      width:32px;
                      vertical-align:top;
                    "
                  >
                    🚗
                  </td>

                  <td
                    style="
                      padding:15px 0;
                      font-size:14px;
                      line-height:1.6;
                    "
                  >
                    Η στάθμευση γίνεται στον δρόμο
                    και συνήθως είναι εύκολη.
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:15px 4px;
                      width:32px;
                      vertical-align:top;
                      border-top:1px solid #eee7dd;
                    "
                  >
                    🕒
                  </td>

                  <td
                    style="
                      padding:15px 0;
                      border-top:1px solid #eee7dd;
                      font-size:14px;
                      line-height:1.6;
                    "
                  >
                    Καθώς το check-in πραγματοποιείται
                    προσωπικά, θα μας βοηθούσε να μας
                    ενημερώσετε για την
                    <strong>
                      περίπου ώρα άφιξής σας
                    </strong>,
                    ώστε να είμαστε έτοιμοι να σας
                    υποδεχτούμε.
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:15px 4px;
                      width:32px;
                      vertical-align:top;
                      border-top:1px solid #eee7dd;
                    "
                  >
                    🪪
                  </td>

                  <td
                    style="
                      padding:15px 0;
                      border-top:1px solid #eee7dd;
                      font-size:14px;
                      line-height:1.6;
                    "
                  >
                    Κατά την άφιξη θα χρειαστεί η
                    επίδειξη ταυτότητας ή διαβατηρίου
                    του κύριου επισκέπτη.
                  </td>
                </tr>
              </table>

              <!-- CONTACT -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  background:#fbf8f3;
                  border-radius:10px;
                  margin-bottom:24px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:18px 20px;
                      font-size:14px;
                      line-height:1.7;
                    "
                  >
                    <strong>
                      Τηλέφωνο / Viber
                    </strong>
                    <br>
                    +30 698 468 4411
                  </td>

                  <td
                    style="
                      padding:18px 20px;
                      font-size:14px;
                      line-height:1.7;
                    "
                  >
                    <strong>
                      Email
                    </strong>
                    <br>

                    <a
                      href="mailto:info@mmhome.gr"
                      style="
                        color:#8a642f;
                      "
                    >
                      info@mmhome.gr
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style="
                  text-align:center;
                  font-size:15px;
                  line-height:1.7;
                  margin:26px 0 12px;
                "
              >
                Σας ευχόμαστε καλό ταξίδι και
                ανυπομονούμε να σας καλωσορίσουμε!
              </p>

            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td
              style="
                padding:10px 28px;
              "
            >
              <div
                style="
                  border-top:1px solid #ded4c7;
                "
              ></div>
            </td>
          </tr>

          <!-- ENGLISH -->
          <tr>
            <td
              style="
                padding:20px 28px 34px;
              "
            >

              <div
                style="
                  text-align:center;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:25px;
                  color:#7a592e;
                  font-weight:bold;
                  line-height:1.25;
                "
              >
                Your stay at MM Home is coming soon
              </div>

              <p
                style="
                  margin:24px 0 10px;
                  font-size:15px;
                "
              >
                Dear ${name},
              </p>

              <p
                style="
                  margin:0 0 20px;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                We are looking forward to welcoming
                you to <strong>MM Home</strong>
                in Trikala.
              </p>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  background:#f7f3ec;
                  border-radius:10px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:18px 20px;
                      font-size:14px;
                      line-height:1.8;
                    "
                  >
                    <strong>
                      Booking code:
                    </strong>
                    ${code}
                    <br>

                    <strong>
                      Check-in:
                    </strong>
                    ${checkInEn}
                    — from 15:00
                    <br>

                    <strong>
                      Check-out:
                    </strong>
                    ${checkOutEn}
                    — by 11:00
                  </td>
                </tr>
              </table>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin:24px 0;
                "
              >
                <tr>
                  <td align="center">
                    <table
                      role="presentation"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          bgcolor="#8a642f"
                          style="
                            border-radius:8px;
                          "
                        >
                          <a
                            href="${DIRECTIONS_URL}"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:14px 26px;
                              color:#ffffff;
                              text-decoration:none;
                              font-size:15px;
                              font-weight:bold;
                            "
                          >
                            Directions to MM Home
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p
                style="
                  font-size:14px;
                  line-height:1.7;
                "
              >
                Street parking is available and
                is usually easy to find.
              </p>

              <p
                style="
                  font-size:14px;
                  line-height:1.7;
                "
              >
                As check-in is personal, please let
                us know your
                <strong>
                  approximate arrival time
                </strong>
                so that we can be ready to welcome you.
              </p>

              <p
                style="
                  font-size:14px;
                  line-height:1.7;
                "
              >
                The main guest will be asked to
                present an ID card or passport
                upon arrival.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              style="
                padding:24px 20px 28px;
                background:#f7f3ec;
              "
            >
              <img
                src="${LOGO_URL}"
                alt="MM Home"
                width="72"
                style="
                  display:block;
                  width:72px;
                  height:auto;
                  border:0;
                  margin:0 auto 8px;
                "
              >

              <div
                style="
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:19px;
                  font-weight:bold;
                  color:#7a592e;
                "
              >
                MM Home
              </div>

              <div
                style="
                  margin-top:4px;
                  color:#857565;
                  font-size:12px;
                  font-style:italic;
                "
              >
                Your Home Away From Home
              </div>

              <div
                style="
                  margin-top:10px;
                  color:#8b837b;
                  font-size:11px;
                "
              >
                Ασκληπιού 44, Τρίκαλα
                ·
                +30 698 468 4411
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendPreArrivalEmail(
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
    const html =
      buildEmailHtml(
        booking
      );

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
