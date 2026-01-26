import type { APIRoute } from "astro";
import { createSessionToken, getSessionCookieName } from "../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => null);

  // @ts-ignore
  const envUser = import.meta.env.AUTH_USER ?? process.env.AUTH_USER;
  // @ts-ignore
  const envPass = import.meta.env.AUTH_PASS ?? process.env.AUTH_PASS;

  if (!body || !body.user || !body.password) {
    return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400 });
  }

  if (!envUser || !envPass) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  if (String(body.user) !== String(envUser) || String(body.password) !== String(envPass)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const token = createSessionToken(body.user);
  cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: import.meta.env.PROD
  });

  return new Response(JSON.stringify({ ok: true }));
};