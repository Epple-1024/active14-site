import { defineMiddleware } from "astro:middleware";
import { getSessionCookieName, verifySessionToken } from "./lib/auth";

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith("/api/login")) {
    return next();
  }

  const protectedPaths = pathname.startsWith("/auth") || pathname.startsWith("/api/report");
  if (!protectedPaths) {
    return next();
  }

  const token = context.cookies.get(getSessionCookieName())?.value;
  const session = verifySessionToken(token);

  if (!session && pathname.startsWith("/api/report")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  return next();
});
