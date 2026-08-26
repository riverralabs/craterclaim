"use server";

import { getAdminSession } from "@/lib/admin/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlot, listPlots, upsertPlot } from "@/lib/plots/inventory";
import { listPlotEvents, recordPlotEvent } from "@/lib/plots/events";
import { listLunarFeatures, upsertLunarFeature } from "@/lib/moon/features";
import { searchPlots } from "@/lib/plots/search";
import type { ActionResult } from "@/lib/plots/actions";
import type { LunarFeature, PlotRecord, PlotStatus } from "@/types";

export async function isCurrentUserAdmin() {
  return Boolean(await getAdminSession());
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export async function listAdminPlots(query = ""): Promise<ActionResult<PlotRecord[]>> {
  if (!(await requireAdmin())) return { ok: false, error: "Admin only." };
  const plots = await listPlots();
  return { ok: true, data: searchPlots(plots, query) };
}

async function setStatus(
  plotId: string,
  status: Extract<PlotStatus, "active" | "suspended">,
  notes?: string,
): Promise<ActionResult<PlotRecord>> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "Admin only." };
  const plot = await getPlot(plotId);
  if (!plot) return { ok: false, error: "Unknown plot." };
  const next = await upsertPlot({
    ...plot,
    status,
    moderationNotes: notes ?? plot.moderationNotes ?? null,
  });
  await recordPlotEvent(plotId, status === "suspended" ? "suspended" : "restored", null, {
    notes,
    admin: session.email,
  });
  return { ok: true, data: next };
}

export async function suspendPlot(plotId: string, notes: string) {
  return setStatus(plotId, "suspended", notes || "Suspended by admin.");
}

export async function restorePlot(plotId: string) {
  return setStatus(plotId, "active", "Restored by admin.");
}

export async function clearPlotLogo(plotId: string): Promise<ActionResult<PlotRecord>> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "Admin only." };
  const plot = await getPlot(plotId);
  if (!plot) return { ok: false, error: "Unknown plot." };
  const next = await upsertPlot({ ...plot, logoUrl: null });
  await recordPlotEvent(plotId, "logo_removed", null, { admin: session.email });
  return { ok: true, data: next };
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  plotCount: number;
  createdAt: string | null;
};

export async function listAdminUsers(): Promise<ActionResult<AdminUserRow[]>> {
  if (!(await requireAdmin())) return { ok: false, error: "Admin only." };
  const plots = await listPlots();
  const counts = new Map<string, number>();
  for (const plot of plots) {
    if (!plot.ownerId) continue;
    counts.set(plot.ownerId, (counts.get(plot.ownerId) ?? 0) + 1);
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: true,
      data: [...counts.entries()].map(([id, plotCount]) => ({
        id,
        email: null,
        plotCount,
        createdAt: null,
      })),
    };
  }

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: data.users.map((user) => ({
      id: user.id,
      email: user.email ?? null,
      plotCount: counts.get(user.id) ?? 0,
      createdAt: user.created_at ?? null,
    })),
  };
}

export async function listAdminEvents() {
  if (!(await requireAdmin())) return { ok: false, error: "Admin only." } as const;
  return { ok: true as const, data: await listPlotEvents() };
}

export async function listAdminFeatures(): Promise<ActionResult<LunarFeature[]>> {
  if (!(await requireAdmin())) return { ok: false, error: "Admin only." };
  return { ok: true, data: await listLunarFeatures() };
}

export async function savePremiumRegion(
  id: string,
  isPremium: boolean,
  radiusDeg: number,
): Promise<ActionResult<LunarFeature>> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "Admin only." };
  const features = await listLunarFeatures();
  const current = features.find((feature) => feature.id === id);
  if (!current) return { ok: false, error: "Unknown region." };
  const next = { ...current, isPremium, radiusDeg };
  await upsertLunarFeature(next);
  await recordPlotEvent(null, "region_updated", null, {
    id,
    isPremium,
    radiusDeg,
    admin: session.email,
  });
  return { ok: true, data: next };
}
