import { getPlot, setPlotAccess, upsertPlot } from "@/lib/plots/inventory";
import { recordPlotEvent } from "@/lib/plots/events";
import { hashSecret, newSecret } from "@/lib/plots/secrets";
import { siteOrigin } from "@/lib/seo/site";
import type { PlotRecord } from "@/types";

type ActivateResult =
  | { ok: true; data: PlotRecord; editUrl?: string }
  | { ok: false; error: string };

function buyerEmail(value?: string | null) {
  const email = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Not a server action. Only the payment webhook (and local mock checkout) may call this. */
export async function activatePlot(
  plotId: string,
  payment: { provider: string; paymentId: string },
  email?: string | null,
): Promise<ActivateResult> {
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
  await recordPlotEvent(next.id, "activated", null, {
    provider: payment.provider,
    paymentId: payment.paymentId,
  });

  const editToken = newSecret();
  const editUrl = `${siteOrigin()}/edit/${editToken}`;
  const emailTo = buyerEmail(email);
  try {
    await setPlotAccess(next.id, {
      editTokenHash: hashSecret(editToken),
      ...(emailTo ? { buyerEmail: emailTo } : {}),
    });
    if (emailTo) {
      const { sendLandingLiveEmail } = await import("@/lib/email/resend");
      await sendLandingLiveEmail(emailTo, next, editUrl);
    }
  } catch (error) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error);
  }
  return { ok: true, data: next, editUrl };
}
