import { revalidateTag, unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import * as fileStore from "@/lib/plots/inventory-file";
import * as dbStore from "@/lib/plots/inventory-supabase";
import type { PlotRecord } from "@/types";

const PUBLIC_PLOTS_TAG = "public-plots";
const PUBLIC_PLOTS_TTL = 300;

function store() {
  return isSupabaseConfigured() ? dbStore : fileStore;
}

export function reservationMs() {
  return fileStore.reservationMs();
}

export async function expireReservations() {
  return store().expireReservations();
}

export async function listPlots() {
  return store().listPlots();
}

export async function listOccupyingPlots() {
  return store().listOccupyingPlots();
}

export async function listActivePlots() {
  return store().listActivePlots();
}

/** Active plots without owner, payment, or moderation fields. Cached until a plot changes. */
export const listPublicPlots = unstable_cache(
  async () => store().listPublicPlots(),
  ["public-plots"],
  { tags: [PUBLIC_PLOTS_TAG], revalidate: PUBLIC_PLOTS_TTL },
);

export const getPublicPlot = unstable_cache(
  async (id: string) => store().getPublicPlot(id),
  ["public-plot"],
  { tags: [PUBLIC_PLOTS_TAG], revalidate: PUBLIC_PLOTS_TTL },
);

export async function getPlot(id: string) {
  return store().getPlot(id);
}

export async function upsertPlot(plot: PlotRecord) {
  const saved = await store().upsertPlot(plot);
  revalidateTag(PUBLIC_PLOTS_TAG);
  return saved;
}

export async function nextPlotId() {
  return store().nextPlotId();
}
