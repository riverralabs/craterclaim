import { isSupabaseConfigured } from "@/lib/supabase/config";
import * as fileStore from "@/lib/plots/inventory-file";
import * as dbStore from "@/lib/plots/inventory-supabase";
import type { PlotRecord } from "@/types";

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

export async function listActivePlots() {
  return store().listActivePlots();
}

export async function getPlot(id: string) {
  return store().getPlot(id);
}

export async function upsertPlot(plot: PlotRecord) {
  return store().upsertPlot(plot);
}

export async function nextPlotId() {
  return store().nextPlotId();
}
