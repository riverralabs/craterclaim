import { NextResponse } from "next/server";
import { activatePlot } from "@/lib/plots/activate";
import { verifyWebhookSignature } from "@/lib/payments/mock";
import { plotIdFromLemonPayload, verifyLemonSignature } from "@/lib/payments/lemon";

function lemonOrder(payload: unknown) {
  const plotId = plotIdFromLemonPayload(payload);
  if (!plotId || !payload || typeof payload !== "object") return null;
  const data = (payload as { data?: { id?: string | number; attributes?: { user_email?: string; status?: string } } }).data;
  const status = data?.attributes?.status;
  if (status && status !== "paid") return { ignored: true as const, plotId, orderId: plotId, email: null };
  return {
    ignored: false as const,
    plotId,
    orderId: data?.id != null ? String(data.id) : plotId,
    email: data?.attributes?.user_email ?? null,
  };
}

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
    const order = lemonOrder(JSON.parse(body));
    if (!order) {
      return NextResponse.json({ ok: false, error: "Missing plot_id." }, { status: 400 });
    }
    if (order.ignored) return NextResponse.json({ ok: true, ignored: true });
    const result = await activatePlot(
      order.plotId,
      {
        provider: "lemon_squeezy",
        paymentId: `ls_${order.orderId}`,
      },
      order.email,
    );
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true });
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
