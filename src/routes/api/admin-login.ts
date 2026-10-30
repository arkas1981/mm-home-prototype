import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  env,
} from "cloudflare:workers";

import {
  setCookie,
} from "@tanstack/react-start/server";

const COOKIE_NAME =
  "__Host-mmhome-admin";

const SESSION_SECONDS =
  60 * 60 * 12;

type AdminEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

function bytesToBase64Url(
  bytes: Uint8Array
) {
  let binary = "";

  for (
    const byte of bytes
  ) {
    binary +=
      String.fromCharCode(
        byte
      );
  }

  return btoa(binary)
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/g,
      ""
    );
}

async function createSessionToken(
  secret: string
) {
  const payload =
    JSON.stringify({
      role:
        "admin",

      exp:
        Math.floor(
          Date.now() /
            1000
        ) +
        SESSION_SECONDS,
    });

  const payloadEncoded =
    bytesToBase64Url(
      new TextEncoder().encode(
        payload
      )
    );

  const key =
    await crypto.subtle.importKey(
      "raw",

      new TextEncoder().encode(
        secret
      ),

      {
        name:
          "HMAC",

        hash:
          "SHA-256",
      },

      false,

      [
        "sign",
      ]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",

      key,

      new TextEncoder().encode(
        payloadEncoded
      )
    );

  return `${payloadEncoded}.${bytesToBase64Url(
    new Uint8Array(
      signature
    )
  )}`;
}

export const Route =
  createFileRoute(
    "/api/admin-login"
  )({
    server: {
      handlers: {
        POST:
          async ({
            request,
          }) => {
            try {
              const body =
                (await request.json()) as {
                  email?: string;
                  password?: string;
                };

              const e =
                env as unknown as AdminEnv;

              if (
                !e.ADMIN_EMAIL ||
                !e.ADMIN_PASSWORD ||
                !e.ADMIN_SESSION_SECRET ||
                e.ADMIN_SESSION_SECRET
                  .length <
                  32
              ) {
                return Response.json(
                  {
                    ok:
                      false,

                    error:
                      "configuration",
                  },

                  {
                    status:
                      500,
                  }
                );
              }

              const email =
                (
                  body.email ??
                  ""
                )
                  .trim()
                  .toLowerCase();

              const password =
                body.password ??
                "";

              if (
                email !==
                  e.ADMIN_EMAIL
                    .trim()
                    .toLowerCase() ||
                password !==
                  e.ADMIN_PASSWORD
              ) {
                return Response.json(
                  {
                    ok:
                      false,

                    error:
                      "credentials",
                  },

                  {
                    status:
                      401,
                  }
                );
              }

              const token =
                await createSessionToken(
                  e.ADMIN_SESSION_SECRET
                );

              setCookie(
                COOKIE_NAME,
                token,
                {
                  httpOnly:
                    true,

                  secure:
                    true,

                  sameSite:
                    "strict",

                  path:
                    "/",

                  maxAge:
                    SESSION_SECONDS,
                }
              );

              return Response.json(
                {
                  ok:
                    true,
                },

                {
                  headers: {
                    "cache-control":
                      "no-store",
                  },
                }
              );
            } catch (
              error
            ) {
              console.error(
                "Admin login API error:",
                error
              );

              return Response.json(
                {
                  ok:
                    false,

                  error:
                    "server",
                },

                {
                  status:
                    500,
                }
              );
            }
          },
      },
    },
  });
