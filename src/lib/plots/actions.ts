"use server";

import { z } from "zod";
import { rectsOverlap, sameGeometry } from "@/lib/plots/overlap";
import {
  countOpenHolds,
  countRateEvents,
  getPlot,
  getPlotAccess,
  listOccupyingPlots,
  nextPlotId,
  recordRateEvent,
  reservationMs,
  setPlotAccess,
  upsertPlot,
} from "@/lib/plots/inventory";
import { QuoteError, quoteGeometry } from "@/lib/plots/quote";
import { mockPaymentId, MOCK_PROVIDER } from "@/lib/payments/mock";
import { createLemonCheckout, lemonConfigured } from "@/lib/payments/lemon";
import { moderationViolation } from "@/lib/moderation/rules";
import { activatePlot } from "@/lib/plots/activate";
import { reservationBlock } from "@/lib/plots/limits";
import { hashSecret, newSecret, SECRET_PATTERN, secretsMatch } from "@/lib/plots/secrets";
import { normalizeSocial } from "@/lib/plots/social";
import { visitorId } from "@/lib/plots/visitor";
import { listLunarFeatures } from "@/lib/moon/features";
import { MARS_FEATURES } from "@/lib/mars/regions";
import { recordPlotEvent } from "@/lib/plots/events";
import { getWorld, plotBody, worldPath, type BodyId } from "@/lib/worlds";
import type { PlotRecord } from "@/types";

const claimTokenSchema = z.string().regex(SECRET_PATTERN);

const geometrySchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  body: z.enum(["moon", "mars"]).optional().default("moon"),
  claimToken: claimTokenSchema.optional(),
});

const claimDetailsSchema = z.object({
  plotId: z.string().regex(/^CLM-\d{4}$/),
  claimToken: claimTokenSchema,
  name: z.string().trim().min(2).max(48),
  description: z.string().trim().max(500).optional().default(""),
  websiteUrl: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("")
    .transform((value) => {
      if (!value) return "";
      if (/^https?:\/\//i.test(value)) return value;
      return `https://${value}`;
    })
    .refine((value) => {
      if (!value) return true;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid website."),
  socialHandle: z
    .string()
    .trim()
    .max(80)
    .optional()
    .default("")
    .transform((value) => normalizeSocial(value)),
  logoUrl: z.string().max(500).optional().nullable(),
  noveltyAcknowledged: z.literal(true),
  immediatePerformanceConsent: z.literal(true),
  termsAccepted: z.literal(true),
});

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function occupyingPlots(plots: PlotRecord[]) {
  return plots.filter(
    (plot) =>
      plot.status === "active" ||
      plot.status === "reserved" ||
      plot.status === "payment_pending" ||
      plot.status === "suspended",
  );
}

function isHold(plot: PlotRecord) {
  return plot.status === "reserved" || plot.status === "payment_pending";
}

function toClient(plot: PlotRecord): PlotRecord {
  return {
    ...plot,
    ownerId: null,
    paymentProvider: null,
    paymentId: null,
    moderationNotes: null,
  };
}

async function featuresFor(body: BodyId) {
  return body === "mars" ? MARS_FEATURES : listLunarFeatures();
}

function landingUrl(origin: string, plot: PlotRecord) {
  return `${origin}${worldPath(plotBody(plot))}?landing=${plot.id}`;
}

async function holdsClaim(plotId: string, token: string) {
  const access = await getPlotAccess(plotId);
  return Boolean(access && secretsMatch(token, access.claimTokenHash));
}

export async function reservePlot(
  input: z.infer<typeof geometrySchema>,
): Promise<ActionResult<{ plot: PlotRecord; claimToken: string }>> {
  const parsed = geometrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid plot geometry." };

  try {
    const visitor = await visitorId();
    const body = parsed.data.body;
    const quote = quoteGeometry(parsed.data, await featuresFor(body));
    const existing = occupyingPlots(await listOccupyingPlots()).filter((plot) => plotBody(plot) === body);
    const overlapping = existing.filter((plot) => rectsOverlap(quote, plot));
    const token = parsed.data.claimToken;
    let ownHold: PlotRecord | null = null;
    if (token) {
      for (const plot of overlapping) {
        if (!isHold(plot) || !sameGeometry(plot, quote)) continue;
        if (await holdsClaim(plot.id, token)) {
          ownHold = plot;
          break;
        }
      }
    }

    if (ownHold && token) {
      const refreshed: PlotRecord = {
        ...ownHold,
        reservedUntil: new Date(Date.now() + reservationMs()).toISOString(),
      };
      await upsertPlot(refreshed);
      return { ok: true, data: { plot: toClient(refreshed), claimToken: token } };
    }

    if (overlapping.length) {
      return { ok: false, error: "That area is already claimed or reserved." };
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const blocked = reservationBlock(
      await countOpenHolds(visitor),
      await countRateEvents(`reserve:${visitor}`, since),
    );
    if (blocked) return { ok: false, error: blocked };

    const now = new Date();
    const plot: PlotRecord = {
      id: await nextPlotId(),
      body,
      x: quote.x,
      y: quote.y,
      width: quote.width,
      height: quote.height,
      pixelCount: quote.pixelCount,
      centerLatitude: quote.centerLat,
      centerLongitude: quote.centerLng,
      lunarFeature: quote.featureName,
      zone: quote.zone,
      status: "reserved",
      quotedPrice: quote.price,
      pricePaid: null,
      claimDate: null,
      reservedUntil: new Date(now.getTime() + reservationMs()).toISOString(),
      name: null,
      description: null,
      websiteUrl: null,
      socialHandle: null,
      logoUrl: null,
      ownerId: null,
      createdAt: now.toISOString(),
    };

    await upsertPlot(plot);
    const claimToken = newSecret();
    await setPlotAccess(plot.id, {
      claimTokenHash: hashSecret(claimToken),
      visitorId: visitor,
    });
    await recordRateEvent(`reserve:${visitor}`);
    await recordPlotEvent(plot.id, "reserved", null);
    return { ok: true, data: { plot: toClient(plot), claimToken } };
  } catch (error) {
    const message = error instanceof QuoteError ? error.message : "Could not reserve this plot.";
    return { ok: false, error: message };
  }
}

export async function submitClaim(
  input: z.infer<typeof claimDetailsSchema>,
): Promise<ActionResult<PlotRecord>> {
  const parsed = claimDetailsSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Check the claim form and try again." };
  }

  if (
    parsed.data.logoUrl &&
    parsed.data.logoUrl !== `/api/plots/${parsed.data.plotId}/logo` &&
    !parsed.data.logoUrl.startsWith("http://") &&
    !parsed.data.logoUrl.startsWith("https://")
  ) {
    return { ok: false, error: "Upload the logo before claiming." };
  }

  const blocked = moderationViolation({
    name: parsed.data.name,
    description: parsed.data.description,
    websiteUrl: parsed.data.websiteUrl,
  });
  if (blocked) return { ok: false, error: blocked };

  const plot = await getPlot(parsed.data.plotId);
  if (!plot) return { ok: false, error: "This reservation expired. Select the plot again." };
  if (plot.status === "active") return { ok: false, error: "This plot is already claimed." };
  if (plot.reservedUntil && new Date(plot.reservedUntil).getTime() < Date.now()) {
    return { ok: false, error: "This reservation expired. Select the plot again." };
  }

  if (!(await holdsClaim(plot.id, parsed.data.claimToken))) {
    return { ok: false, error: "This reservation expired. Select the plot again." };
  }

  const next: PlotRecord = {
    ...plot,
    status: "payment_pending",
    name: parsed.data.name,
    description: parsed.data.description || null,
    websiteUrl: parsed.data.websiteUrl || null,
    socialHandle: parsed.data.socialHandle || null,
    logoUrl: parsed.data.logoUrl || null,
    ownerId: null,
  };

  await upsertPlot(next);
  await recordPlotEvent(next.id, "claim_submitted", null);
  return { ok: true, data: toClient(next) };
}

export async function prepareLemonCheckout(
  plotId: string,
  claimToken: string,
): Promise<ActionResult<{ mode: "lemon" | "mock"; url?: string }>> {
  const plot = await getPlot(plotId);
  if (!plot || !(await holdsClaim(plotId, claimToken))) {
    return { ok: false, error: "This reservation expired. Select the plot again." };
  }
  if (plot.status === "active") return { ok: true, data: { mode: "mock" } };
  if (!lemonConfigured()) return { ok: true, data: { mode: "mock" } };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const url = await createLemonCheckout({
      plotId: plot.id,
      name: plot.name ?? plot.id,
      priceUsd: plot.quotedPrice,
      redirectUrl: landingUrl(origin, plot),
      worldName: getWorld(plotBody(plot)).name,
    });
    return { ok: true, data: { mode: "lemon", url } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not start checkout.",
    };
  }
}

export async function startCheckout(
  plotId: string,
  claimToken: string,
  email?: string,
): Promise<ActionResult<{ mode: "lemon" | "mock"; url?: string; plot?: PlotRecord; editUrl?: string }>> {
  const plot = await getPlot(plotId);
  if (!plot || !(await holdsClaim(plotId, claimToken))) {
    return { ok: false, error: "This reservation expired. Select the plot again." };
  }
  if (plot.status === "active") return { ok: true, data: { mode: "mock", plot: toClient(plot) } };
  if (plot.status !== "payment_pending") {
    return { ok: false, error: "Finish naming this landing before paying." };
  }

  let priceUsd = plot.quotedPrice;
  try {
    priceUsd = quoteGeometry(plot, await featuresFor(plotBody(plot))).price;
  } catch (error) {
    const message = error instanceof QuoteError ? error.message : "Could not price this plot.";
    return { ok: false, error: message };
  }

  if (lemonConfigured()) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    try {
      const url = await createLemonCheckout({
        plotId: plot.id,
        name: plot.name ?? plot.id,
        email,
        priceUsd,
        redirectUrl: landingUrl(origin, plot),
        worldName: getWorld(plotBody(plot)).name,
      });
      return { ok: true, data: { mode: "lemon", url } };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Could not start checkout.",
      };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Checkout is not available." };
  }

  const paid = await activatePlot(
    plotId,
    {
      provider: MOCK_PROVIDER,
      paymentId: mockPaymentId(plotId),
    },
    email,
  );
  if (!paid.ok) return paid;
  return {
    ok: true,
    data: {
      mode: "mock",
      plot: toClient(paid.data),
      editUrl: paid.editUrl,
    },
  };
}

export async function fetchPlot(plotId: string) {
  return getPlot(plotId);
}
