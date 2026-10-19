import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

import { cloudflareRequestEnv } from "../server";

const COOKIE_NAME = "__Host-mmhome-admin";
const SESSION_SECONDS = 60 * 60 * 12;

type AdminEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

function getAdminEnv(): AdminEnv {
  return (cloudflareRequestEnv.getStore() ?? {}) as AdminEnv;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normal = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normal +
    "=".repeat((4 - (normal.length % 4)) % 4);

  const binary = atob(padded);

  return Uint8Array.from(
    binary,
    (c) => c.charCodeAt(0)
  );
}

async function getHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

async function createSessionToken() {
  const { ADMIN_SESSION_SECRET } = getAdminEnv();

  if (
    !ADMIN_SESSION_SECRET ||
    ADMIN_SESSION_SECRET.length < 32
  ) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or too short"
    );
  }

  const payload = JSON.stringify({
    role: "admin",
    exp:
      Math.floor(Date.now() / 1000) +
      SESSION_SECONDS,
  });

  const payloadEncoded = bytesToBase64Url(
    new TextEncoder().encode(payload)
  );

  const key = await getHmacKey(
    ADMIN_SESSION_SECRET
  );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadEncoded)
    );

  return `${payloadEncoded}.${bytesToBase64Url(
    new Uint8Array(signature)
  )}`;
}

async function verifySessionToken(token?: string) {
  if (!token) return false;

  const { ADMIN_SESSION_SECRET } = getAdminEnv();

  if (
    !ADMIN_SESSION_SECRET ||
    ADMIN_SESSION_SECRET.length < 32
  ) {
    return false;
  }

  const [payloadEncoded, signatureEncoded] =
    token.split(".");

  if (!payloadEncoded || !signatureEncoded) {
    return false;
  }

  try {
    const key = await getHmacKey(
      ADMIN_SESSION_SECRET
    );

    const valid =
      await crypto.subtle.verify(
        "HMAC",
        key,
        base64UrlToBytes(signatureEncoded),
        new TextEncoder().encode(payloadEncoded)
      );

    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(
        base64UrlToBytes(payloadEncoded)
      )
    ) as {
      role?: string;
      exp?: number;
    };

    return (
      payload.role === "admin" &&
      typeof payload.exp === "number" &&
      payload.exp >
        Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  return verifySessionToken(
    getCookie(COOKIE_NAME)
  );
}

export async function requireAdminSession() {
  const valid = await isAdminAuthenticated();

  if (!valid) {
    throw new Error("Unauthorized");
  }
}

export async function loginAdmin(
  email: string,
  password: string
) {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = getAdminEnv();

  if (
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD ||
    email.trim().toLowerCase() !==
      ADMIN_EMAIL.trim().toLowerCase() ||
    password !== ADMIN_PASSWORD
  ) {
    return false;
  }

  const token = await createSessionToken();

  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  return true;
}

export function logoutAdmin() {
  deleteCookie(COOKIE_NAME, {
    secure: true,
    sameSite: "strict",
    path: "/",
  });
}
