import { NextResponse } from "next/server";
import { activatePlot } from "@/lib/plots/activate";
import { verifyWebhookSignature } from "@/lib/payments/mock";
import { plotIdFromLemonPayload, verifyLemonSignature } from "@/lib/payments/lemon";

export async function POST(request: Request) {
  const body = await request.text();
  const lemonSignature = request.headers.get("x-signature");

  if (lemonSignature) {
    if (!verifyLemonSignature(body, lemonSignature)) {
      return NextResponse.json({ ok: false, error: "Invalid Lemon Squeezy signature." }, { status: 401 });
    }
    let payload: { meta?: { event_name?: string } };
    try {
      payload = JSON.parse(body) as { meta?: { event_name?: string } };
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
    }
    if (payload.meta?.event_name !== "order_created") {
      return NextResponse.json({ ok: true, ignored: true });
    }
    const plotId = plotIdFromLemonPayload(JSON.parse(body));
    if (!plotId) {
      return NextResponse.json({ ok: false, error: "Missing plot_id." }, { status: 400 });
    }
    const result = await activatePlot(plotId, {
      provider: "lemon_squeezy",
      paymentId: `ls_${plotId}`,
    });
    if (!result.ok) return NextResponse.json(result, { status: 409 });
    return NextResponse.json(result);
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Invalid Lemon Squeezy signature." }, { status: 401 });
  }

  const mockSignature = request.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(body, mockSignature)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: { type?: string; plotId?: string; paymentId?: string };
  try {
    payload = JSON.parse(body) as { type?: string; plotId?: string; paymentId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (payload.type !== "payment.succeeded" || !payload.plotId) {
    return NextResponse.json({ ok: false, error: "Unsupported event." }, { status: 400 });
  }

  const result = await activatePlot(payload.plotId, {
    provider: "webhook",
    paymentId: payload.paymentId ?? `wh_${payload.plotId}`,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result);
}
