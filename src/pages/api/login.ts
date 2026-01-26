import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { createSessionToken, getSessionCookieName } from "../../lib/auth";

export const prerender = false;

function getEnv(name: string) {
  // @ts-ignore
  return import.meta.env[name] ?? process.env[name];
}

function parseUsers(): Map<string, string> {
  const map = new Map<string, string>();

  const raw = String(getEnv("AUTH_USERS") ?? "").trim();
  if (raw) {
    // format: "user1:pass1,user2:pass2"
    for (const part of raw.split(",")) {
      const s = part.trim();
      if (!s) continue;
      const idx = s.indexOf(":");
      if (idx <= 0) continue;
      const user = s.slice(0, idx).trim();
      const pass = s.slice(idx + 1).trim();
      if (user && pass) map.set(user, pass);
    }
  }

  // backward compat (single user)
  const singleUser = String(getEnv("AUTH_USER") ?? "").trim();
  const singlePass = String(getEnv("AUTH_PASS") ?? "").trim();
  if (!map.size && singleUser && singlePass) {
    map.set(singleUser, singlePass);
  }

  return map;
}

function safeEqual(a: string, b: string) {
  // timingSafeEqual requires same length
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function isAllowedOrigin(request: Request) {
  // ブラウザの fetch は Origin が付く。bot/雑POSTは付かない事がある。
  // 厳しくするなら「PRODでは origin/referer 無しは拒否」も可。
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";

  // devは緩め
  // @ts-ignore
  const isProd = import.meta.env.PROD;

  if (!isProd) return true;

  const allowed = ["https://www.active14.org", "https://active14.org"];
  if (origin) return allowed.includes(origin);
  if (referer) return allowed.some((a) => referer.startsWith(a));
  return true; // まずは緩め運用（必要なら false にして締める）
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return new Response(JSON.stringify({ error: "unsupported_media_type" }), { status: 415 });
  }

  const raw = await request.text();
  let body: any = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!body || !body.user || !body.password) {
    return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400 });
  }

  const users = parseUsers();
  if (!users.size) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  const user = String(body.user);
  const pass = String(body.password);

  const expectedPass = users.get(user);
  if (!expectedPass) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  if (!safeEqual(pass, expectedPass)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const token = createSessionToken(user);
  cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: import.meta.env.PROD,
  });

  return new Response(JSON.stringify({ ok: true }));
};