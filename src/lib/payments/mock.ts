import { createHmac, timingSafeEqual } from "crypto";

export const MOCK_PROVIDER = "mock";

export function mockWebhookSecret() {
  return process.env.WEBHOOK_SECRET ?? "craterclaim-dev-webhook";
}

export function signWebhookPayload(body: string, secret = mockWebhookSecret()) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyWebhookSignature(body: string, signature: string | null) {
  if (!signature) return false;
  const expected = signWebhookPayload(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function mockPaymentId(plotId: string) {
  return `mock_${plotId}_${Date.now()}`;
}
