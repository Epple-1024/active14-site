import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { verifySessionToken, getSessionCookieName } from "../../../lib/auth";

export const prerender = false;

function formatMarkdown(input: {
  id: string;
  date: string;
  title: string;
  summary: string;
  participants: string;
  collected: string;
  author: string;   // 追加
  body: string;
}) {
  return `---\nid: "${input.id}"\ndate: "${input.date}"\ntitle: "${input.title}"\nsummary: "${input.summary}"\nparticipants: "${input.participants}"\ncollected: "${input.collected}"\nauthor: "${input.author}"\n---\n\n${input.body.trim()}\n`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get(getSessionCookieName())?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400 });
  }

  const title = String(body.title || "").trim();
  const date = String(body.date || "").trim();
  const summary = String(body.summary || "").trim();
  const participants = String(body.participants || "").trim();
  const collected = String(body.collected || "").trim();
  const contentBody = String(body.body || "").trim();

  if (!title || !date || !summary || !participants || !collected || !contentBody) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  const [year, month] = date.split("-");
  if (!year || !month) {
    return new Response(JSON.stringify({ error: "invalid_date" }), { status: 400 });
  }

  const reports = await getCollection("reports");
  const sameMonth = reports.filter((report: CollectionEntry<"reports">) => report.data.date.startsWith(`${year}-${month}`));
  const id = `${year.slice(2)}${month.padStart(2, "0")}-${sameMonth.length + 1}`;

  const markdown = formatMarkdown({
  id,
  date,
  title,
  summary,
  participants,
  collected,
  author: session.user,
  body: contentBody
});

  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const tokenEnv = process.env.GH_TOKEN;
  const branch = process.env.GH_BRANCH || "main";

  if (!owner || !repo || !tokenEnv) {
    return new Response(JSON.stringify({ error: "github_not_configured" }), { status: 500 });
  }

  const path = `src/content/reports/${id}.md`;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const existing = await fetch(apiBase, {
    headers: {
      Authorization: `Bearer ${tokenEnv}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (existing.ok) {
    return new Response(JSON.stringify({ error: "already_exists", id }), { status: 409 });
  }

  const payload = {
    message: `Add report ${id}`,
    content: Buffer.from(markdown, "utf-8").toString("base64"),
    branch
  };

  const result = await fetch(apiBase, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenEnv}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    const errorText = await result.text();
    return new Response(JSON.stringify({ error: "github_error", detail: errorText }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, id, url: `/r/${id}/` }));
};
