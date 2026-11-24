import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "lavabo_admin_session";
const MAX_AGE_SECONDS = 24 * 60 * 60;
let warnedDevPassword = false;

export function getAdminPassword() {
  const configured = process.env.ADMIN_PASSWORD;
  if (typeof configured === "string" && configured.length > 0) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  if (!warnedDevPassword) {
    console.warn(
      'ADMIN_PASSWORD is not set. Using development password "admin123".'
    );
    warnedDevPassword = true;
  }
  return "admin123";
}

export function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword() || "lavabo-dev";
}

export function createSessionToken(now = Date.now()) {
  const body = Buffer.from(
    JSON.stringify({ exp: now + MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token, now = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && payload.exp > now;
  } catch {
    return false;
  }
}

export function parseCookies(header) {
  const cookies = {};
  if (typeof header !== "string" || !header) return cookies;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

export function sessionCookie(token) {
  return `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearSessionCookie() {
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export function passwordsMatch(input, expected) {
  const actual = Buffer.from(String(input ?? ""));
  const target = Buffer.from(String(expected ?? ""));
  if (actual.length !== target.length) {
    crypto.timingSafeEqual(target, target);
    return false;
  }
  return crypto.timingSafeEqual(actual, target);
}
