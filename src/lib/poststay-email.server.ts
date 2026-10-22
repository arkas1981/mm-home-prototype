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

const SITE_URL =
  "https://mmhome.gr";

const HERO_IMAGE_URL =
  "https://mmhome.gr/prearrival-hero.png";

const HERO_CONTENT_ID =
  "mmhome-poststay-hero";

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
          'guest_poststay'
        )
      `)
      .bind(
        bookingId
      )
      .run();

  return Boolean(
    (
      result as {
        meta?: {
          changes?: number;
        };
      }
    ).meta?.changes
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
          'guest_poststay'
    `)
    .bind(
      bookingId
    )
    .run();
}

function reviewUrl(
  code: string
) {
  return (
    `${SITE_URL}/review/` +
    encodeURIComponent(
      code
    )
  );
}

function buildEmailHtml(
  booking: BookingRow
) {
  const name =
    escapeHtml(
      booking.name
    );

  const review =
    reviewUrl(
      booking.code
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
    Ευχαριστούμε — MM Home
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

          <!-- INLINE HERO -->
          <tr>
            <td style="padding:0;">
              <img
                src="cid:${HERO_CONTENT_ID}"
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
                padding:34px 30px 28px;
              "
            >

              <div
                style="
                  text-align:center;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:29px;
                  line-height:1.25;
                  color:#7a592e;
                  font-weight:bold;
                "
              >
                Ευχαριστούμε που επιλέξατε το MM Home
              </div>

              <p
                style="
                  margin:28px 0 12px;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Αγαπητέ/ή ${name},
              </p>

              <p
                style="
                  margin:0 0 18px;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Ελπίζουμε να απολαύσατε τη διαμονή σας
                και να είχατε μια όμορφη εμπειρία
                στα Τρίκαλα.
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Σας ευχαριστούμε θερμά που επιλέξατε
                το <strong>MM Home</strong>.
              </p>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f7f3ec;
                  border-radius:10px;
                  margin:0 0 26px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:22px;
                      text-align:center;
                    "
                  >
                    <div
                      style="
                        font-family:Georgia,'Times New Roman',serif;
                        font-size:21px;
                        color:#7a592e;
                        font-weight:bold;
                        margin-bottom:10px;
                      "
                    >
                      Η γνώμη σας έχει αξία
                    </div>

                    <div
                      style="
                        font-size:15px;
                        line-height:1.7;
                        color:#5f574f;
                      "
                    >
                      Η αξιολόγησή σας μας βοηθά να
                      βελτιώνουμε συνεχώς την εμπειρία
                      των επισκεπτών μας.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- REVIEW BUTTON -->
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
                            href="${review}"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:15px 30px;
                              font-size:16px;
                              line-height:1;
                              color:#ffffff;
                              text-decoration:none;
                              font-weight:bold;
                            "
                          >
                            ★ Αφήστε την αξιολόγησή σας
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:0;
                  text-align:center;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Σας ευχόμαστε καλό δρόμο και θα
                χαρούμε πολύ να σας φιλοξενήσουμε
                ξανά στο μέλλον.
              </p>

            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td
              style="
                padding:4px 30px 14px;
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
                padding:18px 30px 32px;
              "
            >
              <div
                style="
                  text-align:center;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:24px;
                  color:#7a592e;
                  font-weight:bold;
                  line-height:1.3;
                "
              >
                Thank you for staying at MM Home
              </div>

              <p
                style="
                  margin:24px 0 12px;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Dear ${name},
              </p>

              <p
                style="
                  margin:0 0 18px;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                We hope you enjoyed your stay and
                had a wonderful experience in Trikala.
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Your feedback is very important to us
                and helps us continue improving the
                experience we offer our guests.
              </p>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
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
                            href="${review}"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:14px 28px;
                              color:#ffffff;
                              text-decoration:none;
                              font-size:15px;
                              font-weight:bold;
                            "
                          >
                            Leave your review
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

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
              <div
                style="
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:20px;
                  font-weight:bold;
                  color:#7a592e;
                "
              >
                MM Home
              </div>

              <div
                style="
                  margin-top:5px;
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
                ·
                info@mmhome.gr
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

export async function sendPostStayEmail(
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
                `Ευχαριστούμε που μείνατε στο MM Home · ${booking.code}`,

              html,

              attachments: [
                {
                  path:
                    HERO_IMAGE_URL,

                  filename:
                    "mmhome-poststay.png",

                  content_type:
                    "image/png",

                  content_id:
                    HERO_CONTENT_ID,
                },
              ],
            }),
        }
      );

    if (
      !response.ok
    ) {
      const body =
        await response.text();

      console.error(
        "Post-stay email error:",
        body
      );

      throw new Error(
        "Could not send post-stay email"
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

export async function runPostStayEmails() {
  if (
    currentAthensHour() !==
    14
  ) {
    return;
  }

  const today =
    todayAthens();

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
          AND check_out = ?
          AND email IS NOT NULL
          AND email <> ''
      `)
      .bind(
        today
      )
      .all<BookingRow>();

  for (
    const booking
    of result.results ?? []
  ) {
    try {
      await sendPostStayEmail(
        booking
      );
    } catch (
      error
    ) {
      console.error(
        `Post-stay email failed for ${booking.code}:`,
        error
      );
    }
  }
}
