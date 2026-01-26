import crypto from "node:crypto";

type SessionPayload = {
  user: string;
  issuedAt: number;
  exp: number;
};

const COOKIE_NAME = "active14_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getEnv(name: string) {
  // Astro: dev may expose import.meta.env, deploy/runtime often uses process.env
  // @ts-ignore
  return (import.meta as any)?.env?.[name] ?? process.env[name];
}

function getSecret() {
  const secret = getEnv("AUTH_SECRET");
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return String(secret);
}

export function isProdEnv(): boolean {
  const vercel = getEnv("VERCEL");
  if (vercel) return true;
  const nodeEnv = getEnv("NODE_ENV");
  if (String(nodeEnv || "").toLowerCase() === "production") return true;
  // @ts-ignore
  if ((import.meta as any)?.env?.PROD) return true;
  return false;
}

export function getTtlSeconds(): number {
  const raw = getEnv("AUTH_TTL_SECONDS");
  const seconds = raw ? Number(raw) : DEFAULT_TTL_SECONDS;
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_TTL_SECONDS;
  return Math.floor(seconds);
}

export function getAuthUsersMap(): Record<string, string> {
  // Preferred: AUTH_USERS="user1:pass1,user2:pass2"
  const raw = getEnv("AUTH_USERS");

  // Back-compat (single user): AUTH_USER / AUTH_PASS
  const legacyUser = getEnv("AUTH_USER");
  const legacyPass = getEnv("AUTH_PASS");

  const map: Record<string, string> = {};

  if (raw) {
    String(raw)
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const idx = pair.indexOf(":");
        if (idx <= 0) return;
        const user = pair.slice(0, idx).trim();
        const pass = pair.slice(idx + 1).trim();
        if (!user || !pass) return;
        map[user] = pass;
      });
  }

  if (!Object.keys(map).length && legacyUser && legacyPass) {
    map[String(legacyUser)] = String(legacyPass);
  }

  return map;
}

export function verifyUserPassword(user: string, password: string): boolean {
  const users = getAuthUsersMap();
  if (!Object.keys(users).length) return false;

  const key = String(user);
  const expected = users[key];
  if (typeof expected !== "string" || expected.length === 0) return false;

  const provided = String(password);
  const a = Buffer.from(provided, "utf-8");
  const b = Buffer.from(expected, "utf-8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
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
    exp: now + getTtlSeconds() * 1000
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