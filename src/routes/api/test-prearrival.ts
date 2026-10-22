import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  env,
} from "cloudflare:workers";

export const Route =
  createFileRoute(
    "/api/test-prearrival"
  )({
    server: {
      handlers: {
        GET: async () => {
          const {
            requireAdminSession,
          } = await import(
            "@/lib/admin-auth.server"
          );

          await requireAdminSession();

          const apiKey =
            (
              env as unknown as {
                RESEND_API_KEY?: string;
              }
            ).RESEND_API_KEY;

          if (
            !apiKey ||
            !apiKey.startsWith(
              "re_"
            )
          ) {
            return new Response(
              "RESEND_API_KEY missing",
              {
                status: 500,
              }
            );
          }

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

              <div style="padding:28px 10px;">

                <h2 style="
                  text-align:center;
                  margin-top:0;
                ">
                  Η διαμονή σας στο MM Home πλησιάζει
                </h2>

                <p>
                  Αγαπητέ/ή Γιώργο,
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
                  MM-TEST01
                  <br><br>

                  <strong>Άφιξη:</strong>
                  24 Οκτωβρίου 2026
                  — check-in από τις 15:00
                  <br>

                  <strong>Αναχώρηση:</strong>
                  27 Οκτωβρίου 2026
                  — check-out έως τις 11:00
                  <br>

                  <strong>Επισκέπτες:</strong>
                  2
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
                  Η στάθμευση γίνεται στον δρόμο και συνήθως είναι εύκολη.
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
                  Dear George,
                </p>

                <p>
                  We are looking forward to welcoming you
                  to <strong>MM Home</strong> in Trikala.
                </p>

                <p>
                  <strong>Booking code:</strong>
                  MM-TEST01<br>

                  <strong>Check-in:</strong>
                  24 October 2026 — from 15:00<br>

                  <strong>Check-out:</strong>
                  27 October 2026 — by 11:00
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
                  Street parking is available and is usually easy to find.
                </p>

                <p>
                  As check-in is personal, please let us know your
                  <strong>approximate arrival time</strong>.
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

                    reply_to:
                      "info@mmhome.gr",

                    subject:
                      "ΔΟΚΙΜΗ — Η διαμονή σας στο MM Home πλησιάζει",

                    html,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            return new Response(
              await response.text(),
              {
                status:
                  response.status,
              }
            );
          }

          return new Response(
            "Pre-arrival test email sent",
            {
              status: 200,
            }
          );
        },
      },
    },
  });
