import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  env,
} from "cloudflare:workers";

import {
  setCookie,
} from "@tanstack/react-start/server";

type AdminEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

async function testCrypto(
  secret: string
) {
  try {
    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(
          secret
        ),
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        false,
        ["sign"]
      );

    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        "mmhome-diagnostic"
      )
    );

    return {
      ok: true,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

function testCookie() {
  try {
    setCookie(
      "__Host-mmhome-diagnostic",
      "ok",
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60,
      }
    );

    return {
      ok: true,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

export const Route =
  createFileRoute(
    "/api/admin-diagnostic"
  )({
    server: {
      handlers: {
        GET: async () => {
          const e =
            env as unknown as AdminEnv;

          const emailLoaded =
            typeof e.ADMIN_EMAIL ===
              "string" &&
            e.ADMIN_EMAIL.length >
              0;

          const passwordLoaded =
            typeof e.ADMIN_PASSWORD ===
              "string" &&
            e.ADMIN_PASSWORD.length >
              0;

          const sessionSecretLoaded =
            typeof e.ADMIN_SESSION_SECRET ===
              "string" &&
            e.ADMIN_SESSION_SECRET.length >=
              32;

          const cryptoTest =
            sessionSecretLoaded
              ? await testCrypto(
                  e.ADMIN_SESSION_SECRET!
                )
              : {
                  ok: false,
                  error:
                    "ADMIN_SESSION_SECRET missing or shorter than 32 characters",
                };

          const cookieTest =
            testCookie();

          return Response.json(
            {
              adminEmailLoaded:
                emailLoaded,

              adminPasswordLoaded:
                passwordLoaded,

              adminSessionSecretLoaded:
                sessionSecretLoaded,

              cryptoWorks:
                cryptoTest.ok,

              cryptoError:
                cryptoTest.error,

              cookieWriteWorks:
                cookieTest.ok,

              cookieWriteError:
                cookieTest.error,
            },
            {
              headers: {
                "cache-control":
                  "no-store",
              },
            }
          );
        },
      },
    },
  });
