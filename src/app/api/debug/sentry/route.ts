import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.WEBHOOK_SECRET;
    const provided = new URL(request.url).searchParams.get("secret");
    if (!secret || provided !== secret) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
  }

  throw new Error(`Sentry test error craterclaim ${Date.now()}`);
}
