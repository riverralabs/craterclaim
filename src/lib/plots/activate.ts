import { createAdminClient } from "@/lib/supabase/admin";
import { getPlot, upsertPlot } from "@/lib/plots/inventory";
import { recordPlotEvent } from "@/lib/plots/events";
import type { PlotRecord } from "@/types";

type ActivateResult = { ok: true; data: PlotRecord } | { ok: false; error: string };

/** Not a server action. Only the payment webhook (and local mock checkout) may call this. */
export async function activatePlot(
  plotId: string,
  payment: { provider: string; paymentId: string },
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
        const { sendLandingLiveEmail } = await import("@/lib/email/resend");
        await sendLandingLiveEmail(email, next);
      } catch (error) {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(error);
      }
    }
  }
  return { ok: true, data: next };
}
