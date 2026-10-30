import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  env,
} from "cloudflare:workers";

import {
  deleteCookie,
  getCookie,
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

function base64UrlToBytes(
  value: string
) {
  const normal =
    value
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const padded =
    normal +
    "=".repeat(
      (
        4 -
        (
          normal.length %
          4
        )
      ) %
        4
    );

  const binary =
    atob(
      padded
    );

  return Uint8Array.from(
    binary,
    (c) =>
      c.charCodeAt(
        0
      )
  );
}

async function getHmacKey(
  secret: string
) {
  return crypto.subtle.importKey(
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
      "verify",
    ]
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
    await getHmacKey(
      secret
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

async function verifySessionToken(
  token:
    | string
    | undefined,
  secret: string
) {
  if (!token) {
    return false;
  }

  const [
    payloadEncoded,
    signatureEncoded,
  ] =
    token.split(
      "."
    );

  if (
    !payloadEncoded ||
    !signatureEncoded
  ) {
    return false;
  }

  try {
    const key =
      await getHmacKey(
        secret
      );

    const valid =
      await crypto.subtle.verify(
        "HMAC",

        key,

        base64UrlToBytes(
          signatureEncoded
        ),

        new TextEncoder().encode(
          payloadEncoded
        )
      );

    if (!valid) {
      return false;
    }

    const payload =
      JSON.parse(
        new TextDecoder().decode(
          base64UrlToBytes(
            payloadEncoded
          )
        )
      ) as {
        role?: string;
        exp?: number;
      };

    return (
      payload.role ===
        "admin" &&
      typeof payload.exp ===
        "number" &&
      payload.exp >
        Math.floor(
          Date.now() /
            1000
        )
    );
  } catch {
    return false;
  }
}

function getAdminEnv() {
  return env as unknown as AdminEnv;
}

export const Route =
  createFileRoute(
    "/api/admin-login"
  )({
    server: {
      handlers: {
        GET:
          async () => {
            try {
              const e =
                getAdminEnv();

              if (
                !e.ADMIN_SESSION_SECRET ||
                e.ADMIN_SESSION_SECRET
                  .length <
                  32
              ) {
                return Response.json(
                  {
                    authenticated:
                      false,
                  },

                  {
                    headers: {
                      "cache-control":
                        "no-store",
                    },
                  }
                );
              }

              const authenticated =
                await verifySessionToken(
                  getCookie(
                    COOKIE_NAME
                  ),

                  e.ADMIN_SESSION_SECRET
                );

              return Response.json(
                {
                  authenticated,
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
                "Admin session API error:",
                error
              );

              return Response.json(
                {
                  authenticated:
                    false,
                },

                {
                  status:
                    500,

                  headers: {
                    "cache-control":
                      "no-store",
                  },
                }
              );
            }
          },

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
                getAdminEnv();

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

        DELETE:
          async () => {
            try {
              deleteCookie(
                COOKIE_NAME,
                {
                  secure:
                    true,

                  sameSite:
                    "strict",

                  path:
                    "/",
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
                "Admin logout API error:",
                error
              );

              return Response.json(
                {
                  ok:
                    false,
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
