import "./lib/error-capture";

import {
  AsyncLocalStorage,
} from "node:async_hooks";

import {
  consumeLastCapturedError,
} from "./lib/error-capture";

import {
  renderErrorPage,
} from "./lib/error-page";

type WorkerEnv = {
  DB?: D1Database;
};

type TestBookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  name: string;
  email: string;
  access_code:
    | string
    | null;
  checkin_token:
    | string
    | null;
};

export const cloudflareRequestEnv =
  new AsyncLocalStorage<WorkerEnv>();

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown
  ) =>
    | Promise<Response>
    | Response;
};

let serverEntryPromise:
  | Promise<ServerEntry>
  | undefined;

async function getServerEntry():
  Promise<ServerEntry> {
  if (
    !serverEntryPromise
  ) {
    serverEntryPromise =
      import(
        "@tanstack/react-start/server-entry"
      ).then(
        (module) =>
          (
            module.default ??
            module
          ) as ServerEntry
      );
  }

  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(
  response: Response
):
  Promise<Response> {
  if (
    response.status < 500
  ) {
    return response;
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    return response;
  }

  const body =
    await response
      .clone()
      .text();

  if (
    !isH3SwallowedErrorBody(
      body
    )
  ) {
    return response;
  }

  console.error(
    consumeLastCapturedError() ??
      new Error(
        `h3 swallowed SSR error: ${body}`
      )
  );

  return new Response(
    renderErrorPage(),
    {
      status: 500,

      headers: {
        "content-type":
          "text/html; charset=utf-8",
      },
    }
  );
}

function isH3SwallowedErrorBody(
  body: string
) {
  try {
    const payload =
      JSON.parse(
        body
      ) as {
        unhandled?: unknown;
        message?: unknown;
      };

    return (
      payload.unhandled === true &&
      payload.message ===
        "HTTPError"
    );
  } catch {
    return false;
  }
}

async function testPreArrivalEmail(
  env:
    WorkerEnv
) {
  const db =
    env.DB;

  if (!db) {
    return new Response(
      "DB unavailable",
      {
        status: 500,
      }
    );
  }

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
          access_code,
          checkin_token
        FROM bookings
        WHERE code = 'MM-NWDKTZ'
        LIMIT 1
      `)
      .first<
        TestBookingRow
      >();

  if (!booking) {
    return new Response(
      "Booking not found",
      {
        status: 404,
      }
    );
  }

  const existing =
    await db
      .prepare(`
        SELECT
          booking_id
        FROM booking_notifications
        WHERE
          booking_id = ?
          AND kind =
            'guest_prearrival_2d'
        LIMIT 1
      `)
      .bind(
        booking.id
      )
      .first<{
        booking_id:
          string;
      }>();

  /*
   * Temporarily remove the
   * notification lock so that
   * the normal pre-arrival sender
   * can be used for the test.
   */
  if (existing) {
    await db
      .prepare(`
        DELETE FROM booking_notifications
        WHERE
          booking_id = ?
          AND kind =
            'guest_prearrival_2d'
      `)
      .bind(
        booking.id
      )
      .run();
  }

  try {
    const {
      sendPreArrivalEmail,
    } =
      await import(
        "./lib/prearrival-email.server"
      );

    /*
     * Send the real template,
     * but ONLY to MM Home.
     */
    await sendPreArrivalEmail({
      ...booking,

      email:
        "info@mmhome.gr",
    });

    /*
     * Remove the test claim.
     */
    await db
      .prepare(`
        DELETE FROM booking_notifications
        WHERE
          booking_id = ?
          AND kind =
            'guest_prearrival_2d'
      `)
      .bind(
        booking.id
      )
      .run();

    /*
     * Restore previous state
     * if this booking had already
     * been marked as sent.
     */
    if (existing) {
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
          booking.id
        )
        .run();
    }

    return new Response(
      "TEST EMAIL SENT TO info@mmhome.gr",
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    /*
     * Clean test claim.
     */
    await db
      .prepare(`
        DELETE FROM booking_notifications
        WHERE
          booking_id = ?
          AND kind =
            'guest_prearrival_2d'
      `)
      .bind(
        booking.id
      )
      .run();

    if (existing) {
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
          booking.id
        )
        .run();
    }

    console.error(
      "Pre-arrival test failed:",
      error
    );

    return new Response(
      "TEST EMAIL FAILED",
      {
        status: 500,
      }
    );
  }
}

export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: unknown
  ) {
    return cloudflareRequestEnv.run(
      env as WorkerEnv,
      async () => {
        try {
          const url =
            new URL(
              request.url
            );

          /*
           * TEMPORARY TEST URL.
           * Sends only to:
           * info@mmhome.gr
           */
          if (
            url.pathname ===
              "/__mmhome-test-prearrival-7x4k9"
          ) {
            return await testPreArrivalEmail(
              env as WorkerEnv
            );
          }

          const handler =
            await getServerEntry();

          const response =
            await handler.fetch(
              request,
              env,
              ctx
            );

          return await normalizeCatastrophicSsrResponse(
            response
          );
        } catch (
          error
        ) {
          console.error(
            error
          );

          return new Response(
            renderErrorPage(),
            {
              status: 500,

              headers: {
                "content-type":
                  "text/html; charset=utf-8",
              },
            }
          );
        }
      }
    );
  },

  async scheduled(
    _controller: unknown,
    env: unknown,
    ctx: {
      waitUntil:
        (
          promise:
            Promise<unknown>
        ) => void;
    }
  ) {
    ctx.waitUntil(
      cloudflareRequestEnv.run(
        env as WorkerEnv,
        async () => {
          const {
            runEmailFailSafe,
          } =
            await import(
              "./lib/email-failsafe.server"
            );

          await runEmailFailSafe();
        }
      )
    );
  },
};
