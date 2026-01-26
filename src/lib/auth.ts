import crypto from "node:crypto";

type SessionPayload = {
  user: string;
  issuedAt: number;
};

const COOKIE_NAME = "active14_session";

function getSecret() {
  // ▼ 修正箇所：import.meta.env を優先的に見るように変更
  // @ts-ignore
  const secret = import.meta.env.AUTH_SECRET ?? process.env.AUTH_SECRET;
  
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
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
  const payload: SessionPayload = {
    user,
    issuedAt: Date.now()
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
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}
