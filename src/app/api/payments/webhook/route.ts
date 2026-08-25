import { NextResponse } from "next/server";
import { activatePlot } from "@/lib/plots/actions";
import { verifyWebhookSignature } from "@/lib/payments/mock";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(body, signature)) {
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
