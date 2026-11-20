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
  DB?: unknown;
  CRON_SECRET?: string;
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

async function runEmailCron(
  request: Request,
  env: WorkerEnv
) {
  const auth =
    request.headers.get(
      "authorization"
    );

  if (
    !env.CRON_SECRET ||
    auth !==
      `Bearer ${env.CRON_SECRET}`
  ) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
      }
    );
  }

  console.log(
    "MM Home HTTP email cron started"
  );

  try {
    const {
      runEmailFailSafe,
    } =
      await import(
        "./lib/email-failsafe.server"
      );

    await runEmailFailSafe();

    console.log(
      "MM Home HTTP email cron completed"
    );

    return new Response(
      "OK",
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "MM Home HTTP email cron failed:",
      error
    );

    return new Response(
      "FAILED",
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

          if (
            url.pathname ===
              "/internal/email-cron"
          ) {
            return await runEmailCron(
              request,
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
};
