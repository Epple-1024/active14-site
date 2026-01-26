import type { APIRoute } from "astro";
import {
  createSessionToken,
  getAuthUsersMap,
  getSessionCookieName,
  getTtlSeconds,
  isProdEnv,
  verifyUserPassword
} from "../../lib/auth";

export const prerender = false;

function isAllowedOrigin(request: Request) {
  // ブラウザの fetch は Origin が付く。bot/雑POSTは付かない事がある。
  // 厳しくするなら「PRODでは origin/referer 無しは拒否」も可。
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";

  // dev は緩め
  if (!isProdEnv()) return true;

  const allowed = ["https://www.active14.org", "https://active14.org"];
  if (origin) return allowed.includes(origin);
  if (referer) return allowed.some((a) => referer.startsWith(a));
  return true; // まずは緩め運用（必要なら false にして締める）
}

function getCookieDomain(request: Request) {
  // www / apex 両方で使えるように（PRODのみ）
  if (!isProdEnv()) return undefined;
  try {
    const host = new URL(request.url).hostname;
    if (host === "active14.org" || host.endsWith(".active14.org")) {
      return ".active14.org";
    }
  } catch {
    // ignore
  }
  return undefined;
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

  // サーバ側の認証設定が未投入なら 500
  const users = getAuthUsersMap();
  if (!Object.keys(users).length) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  const user = String(body.user).trim();
  const pass = String(body.password);
  if (!user) {
    return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400 });
  }

  if (!verifyUserPassword(user, pass)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const token = createSessionToken(user);

  const domain = getCookieDomain(request);
  cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProdEnv(),
    maxAge: getTtlSeconds(),
    ...(domain ? { domain } : {})
  });

  return new Response(JSON.stringify({ ok: true }));
};