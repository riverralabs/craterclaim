"use server";

import { z } from "zod";
import { findOverlappingPlot } from "@/lib/plots/overlap";
import {
  getPlot,
  listPlots,
  nextPlotId,
  reservationMs,
  upsertPlot,
} from "@/lib/plots/inventory";
import { QuoteError, quoteGeometry } from "@/lib/plots/quote";
import { mockPaymentId, MOCK_PROVIDER } from "@/lib/payments/mock";
import { createLemonCheckout, lemonConfigured } from "@/lib/payments/lemon";
import { moderationViolation } from "@/lib/moderation/rules";
import { getAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSocial } from "@/lib/plots/social";
import { listLunarFeatures } from "@/lib/moon/features";
import { recordPlotEvent } from "@/lib/plots/events";
import { sendLandingLiveEmail } from "@/lib/email/resend";
import type { PlotRecord } from "@/types";

const geometrySchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const claimDetailsSchema = z.object({
  plotId: z.string().regex(/^CLM-\d{4}$/),
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
    .refine((value) => !value || URL.canParse(value), "Enter a valid website."),
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

export async function reservePlot(
  input: z.infer<typeof geometrySchema>,
): Promise<ActionResult<PlotRecord>> {
  const parsed = geometrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid plot geometry." };

  try {
    const quote = quoteGeometry(parsed.data, await listLunarFeatures());
    const existing = occupyingPlots(await listPlots());
    if (findOverlappingPlot(quote, existing)) {
      return { ok: false, error: "That area is already claimed or reserved." };
    }

    const user = await getAuthUser();
    if (isSupabaseConfigured() && !user) {
      return { ok: false, error: "Sign in to reserve a plot." };
    }

    const now = new Date();
    const plot: PlotRecord = {
      id: await nextPlotId(),
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
      ownerId: user?.id ?? null,
      createdAt: now.toISOString(),
    };

    await upsertPlot(plot);
    await recordPlotEvent(plot.id, "reserved", user?.id ?? null);
    return { ok: true, data: plot };
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

  const user = await getAuthUser();
  if (isSupabaseConfigured()) {
    if (!user) return { ok: false, error: "Sign in to finish this claim." };
    if (plot.ownerId && plot.ownerId !== user.id) {
      return { ok: false, error: "This reservation belongs to another account." };
    }
  }

  const next: PlotRecord = {
    ...plot,
    status: "payment_pending",
    name: parsed.data.name,
    description: parsed.data.description || null,
    websiteUrl: parsed.data.websiteUrl || null,
    socialHandle: parsed.data.socialHandle || null,
    logoUrl: parsed.data.logoUrl || null,
    ownerId: user?.id ?? plot.ownerId,
  };

  await upsertPlot(next);
  await recordPlotEvent(next.id, "claim_submitted", user?.id ?? null);
  return { ok: true, data: next };
}

export async function activatePlot(
  plotId: string,
  payment: { provider: string; paymentId: string },
): Promise<ActionResult<PlotRecord>> {
  const plot = await getPlot(plotId);
  if (!plot) return { ok: false, error: "Unknown plot." };
  if (plot.status === "active") return { ok: true, data: plot };
  if (plot.status !== "payment_pending") {
    return { ok: false, error: "This plot is not ready for payment." };
  }

  const next: PlotRecord = {
    ...plot,
    status: "active",
    pricePaid: plot.quotedPrice,
    claimDate: new Date().toISOString(),
    reservedUntil: null,
    paymentProvider: payment.provider,
    paymentId: payment.paymentId,
  };
  await upsertPlot(next);
  await recordPlotEvent(next.id, "activated", next.ownerId, {
    provider: payment.provider,
    paymentId: payment.paymentId,
  });
  if (next.ownerId) {
    const admin = createAdminClient();
    const email = admin
      ? (await admin.auth.admin.getUserById(next.ownerId)).data.user?.email
      : null;
    if (email) {
      try {
        await sendLandingLiveEmail(email, next);
      } catch {
        // Payment already succeeded; email is best-effort.
      }
    }
  }
  return { ok: true, data: next };
}

export async function mockCompletePayment(plotId: string): Promise<ActionResult<PlotRecord>> {
  return activatePlot(plotId, {
    provider: MOCK_PROVIDER,
    paymentId: mockPaymentId(plotId),
  });
}

export async function startCheckout(
  plotId: string,
): Promise<ActionResult<{ mode: "lemon" | "mock"; url?: string; plot?: PlotRecord }>> {
  const plot = await getPlot(plotId);
  if (!plot) return { ok: false, error: "This reservation expired. Select the plot again." };
  if (plot.status === "active") return { ok: true, data: { mode: "mock", plot } };
  if (plot.status !== "payment_pending") {
    return { ok: false, error: "Finish naming this landing before paying." };
  }

  if (lemonConfigured()) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const user = await getAuthUser();
    try {
      const url = await createLemonCheckout({
        plotId: plot.id,
        name: plot.name ?? plot.id,
        email: user?.email,
        priceUsd: plot.quotedPrice,
        redirectUrl: `${origin}/?landing=${plot.id}`,
      });
      return { ok: true, data: { mode: "lemon", url } };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Could not start checkout.",
      };
    }
  }

  const paid = await mockCompletePayment(plotId);
  if (!paid.ok) return paid;
  return { ok: true, data: { mode: "mock", plot: paid.data } };
}

export async function fetchPlot(plotId: string) {
  return getPlot(plotId);
}
