import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const provided = new URL(request.url).searchParams.get("secret");
    const allowed = [process.env.WEBHOOK_SECRET, process.env.LEMON_SQUEEZY_WEBHOOK_SECRET].filter(
      (value): value is string => Boolean(value),
    );
    if (!provided || !allowed.includes(provided)) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
  }

  throw new Error(`Sentry test error craterclaim ${Date.now()}`);
}
