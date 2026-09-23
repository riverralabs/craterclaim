"use server";

import { z } from "zod";
import { moderationViolation } from "@/lib/moderation/rules";
import { sendLandingLinks } from "@/lib/email/resend";
import {
  countRateEvents,
  getPlotByEditTokenHash,
  listPlotsByBuyerEmail,
  recordRateEvent,
  setPlotAccess,
  upsertPlot,
} from "@/lib/plots/inventory";
import { MAX_LOOKUP_IP_PER_HOUR, MAX_LOOKUPS_PER_HOUR } from "@/lib/plots/limits";
import { hashSecret, newSecret, SECRET_PATTERN } from "@/lib/plots/secrets";
import { normalizeSocial } from "@/lib/plots/social";
import { requestIp } from "@/lib/plots/visitor";
import { siteOrigin } from "@/lib/seo/site";
import type { PlotRecord } from "@/types";

const FOUND_MESSAGE = "If that email has a landing, we sent the links.";

const websiteSchema = z
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
  }, "Enter a valid website.");

const editSchema = z.object({
  token: z.string().regex(SECRET_PATTERN),
  websiteUrl: websiteSchema,
  socialHandle: z.string().trim().max(80).optional().default("").transform((value) => normalizeSocial(value)),
  logoUrl: z.string().max(500).optional().nullable(),
});

function logoAllowed(plotId: string, url: string) {
  if (url === `/api/plots/${plotId}/logo` || url.startsWith(`/api/plots/${plotId}/logo?`)) return true;
  try {
    return new URL(url).pathname.includes(`/plots/${plotId}`);
  } catch {
    return false;
  }
}

export async function updateLanding(
  input: z.infer<typeof editSchema>,
): Promise<{ ok: true; plot: PlotRecord } | { ok: false; error: string }> {
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const plot = await getPlotByEditTokenHash(hashSecret(parsed.data.token));
  if (!plot) return { ok: false, error: "This edit link is no longer valid." };

  const blocked = moderationViolation({
    name: plot.name ?? plot.id,
    websiteUrl: parsed.data.websiteUrl,
  });
  if (blocked) return { ok: false, error: blocked };

  let logoUrl = plot.logoUrl;
  if (parsed.data.logoUrl) {
    if (!logoAllowed(plot.id, parsed.data.logoUrl)) {
      return { ok: false, error: "Upload the logo again." };
    }
    logoUrl = parsed.data.logoUrl;
  }

  const next: PlotRecord = {
    ...plot,
    websiteUrl: parsed.data.websiteUrl || null,
    socialHandle: parsed.data.socialHandle || null,
    logoUrl,
  };
  await upsertPlot(next);
  return { ok: true, plot: next };
}

export async function requestLandingLinks(emailInput: string) {
  const email = z.string().trim().email().max(200).safeParse(emailInput);
  if (!email.success) return { ok: true as const, message: FOUND_MESSAGE };
  const normalized = email.data.toLowerCase();

  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const ip = await requestIp();
    const [byEmail, byIp] = await Promise.all([
      countRateEvents(`lookup:${normalized}`, since),
      countRateEvents(`lookup-ip:${ip}`, since),
    ]);
    if (byEmail >= MAX_LOOKUPS_PER_HOUR || byIp >= MAX_LOOKUP_IP_PER_HOUR) {
      return { ok: true as const, message: FOUND_MESSAGE };
    }
    await recordRateEvent(`lookup:${normalized}`);
    await recordRateEvent(`lookup-ip:${ip}`);

    const plots = await listPlotsByBuyerEmail(normalized);
    const origin = siteOrigin();
    const links = [];
    for (const plot of plots) {
      const token = newSecret();
      await setPlotAccess(plot.id, { editTokenHash: hashSecret(token) });
      links.push({
        id: plot.id,
        name: plot.name ?? plot.id,
        url: `${origin}/plot/${plot.id}`,
        editUrl: `${origin}/edit/${token}`,
      });
    }
    if (links.length) await sendLandingLinks(normalized, links);
  } catch (error) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error);
  }

  return { ok: true as const, message: FOUND_MESSAGE };
}
