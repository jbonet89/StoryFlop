import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/feedback";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 415 });
  }
  // Bound the stream itself: Content-Length can be absent or untrusted.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 24000) {
      await reader.cancel();
      return NextResponse.json({ error: "TOO_LARGE" }, { status: 413 });
    }
    chunks.push(value);
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  // Vercel overwrites this header. Do not trust the client-controlled forwarded-for header.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ?? "local";
  const fingerprint = createHmac("sha256", key).update(ip).digest("hex");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { kind, title, description, name, email, locale } = parsed.data;
  try {
    const { error } = await db.rpc("submit_feedback", {
      p_kind: kind, p_title: title, p_description: description,
      p_name: name, p_email: email, p_locale: locale, p_fingerprint: fingerprint,
    });
    if (error) {
      if (error.message.includes("FEEDBACK_RATE_LIMITED")) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": "3600" } });
      }
      console.error("Feedback submission failed", error.code);
      return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  }
}
