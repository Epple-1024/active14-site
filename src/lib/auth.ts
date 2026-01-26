import crypto from "node:crypto";

type SessionPayload = {
  user: string;
  issuedAt: number;
  exp: number; // 追加
};

const COOKIE_NAME = "active14_session";

function getEnv(name: string) {
  // @ts-ignore
  return import.meta.env[name] ?? process.env[name];
}

function getSecret() {
  const secret = getEnv("AUTH_SECRET");
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return String(secret);
}

function getTtlMs() {
  // 秒で指定。未指定は7日
  const raw = getEnv("AUTH_TTL_SECONDS");
  const seconds = raw ? Number(raw) : 60 * 60 * 24 * 7;
  if (!Number.isFinite(seconds) || seconds <= 0) return 60 * 60 * 24 * 7 * 1000;
  return seconds * 1000;
}

function base64url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(user: string) {
  const now = Date.now();
  const payload: SessionPayload = {
    user,
    issuedAt: now,
    exp: now + getTtlMs(),
  };
  const encoded = base64url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const sb = Buffer.from(signature);
  const eb = Buffer.from(expected);
  if (sb.length !== eb.length) return null;
  if (!crypto.timingSafeEqual(sb, eb)) return null;

  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as SessionPayload;

    if (!payload?.user || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}