import { createHmac, timingSafeEqual } from "crypto";

export function lemonConfigured() {
  return Boolean(
    process.env.LEMON_SQUEEZY_API_KEY &&
      process.env.LEMON_SQUEEZY_STORE_ID &&
      process.env.LEMON_SQUEEZY_VARIANT_ID,
  );
}

function apiKey() {
  const key = process.env.LEMON_SQUEEZY_API_KEY;
  if (!key) throw new Error("Missing LEMON_SQUEEZY_API_KEY");
  return key;
}

export async function createLemonCheckout(input: {
  plotId: string;
  name: string;
  email?: string | null;
  priceUsd: number;
  redirectUrl: string;
}) {
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID!;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID!;
  const cents = Math.round(input.priceUsd * 100);

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          custom_price: cents,
          checkout_options: {
            embed: true,
            media: false,
            logo: true,
            desc: false,
            discount: false,
            button_color: "#e0b84f",
          },
          checkout_data: {
            email: input.email ?? undefined,
            name: input.name,
            custom: { plot_id: input.plotId },
          },
          product_options: {
            name: `CraterClaim ${input.plotId}`,
            description: `Digital lunar plot ${input.plotId}. Not physical land.`,
            redirect_url: input.redirectUrl,
            receipt_thank_you_note: "Your landing is on the Moon.",
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    data?: { attributes?: { url?: string } };
    errors?: { detail?: string }[];
  };
  if (!response.ok || !payload.data?.attributes?.url) {
    throw new Error(payload.errors?.[0]?.detail ?? "Could not start Lemon Squeezy checkout.");
  }
  return payload.data.attributes.url;
}

export function verifyLemonSignature(body: string, signature: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function plotIdFromLemonPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as {
    meta?: { custom_data?: { plot_id?: string } };
    data?: { attributes?: { first_order_item?: { product_name?: string } } };
  };
  const custom = root.meta?.custom_data?.plot_id;
  if (typeof custom === "string" && /^CLM-\d{4}$/.test(custom)) return custom;
  return null;
}
