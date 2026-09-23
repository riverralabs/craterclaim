import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { GRID_REVISION, migratePlotToCurrentGrid } from "@/lib/moon/grid";
import type { PlotRecord } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "plots.json");
const RESERVATION_MS = 15 * 60 * 1000;

type GlobalPlots = typeof globalThis & {
  __craterclaimPlots?: Map<string, PlotRecord>;
  __craterclaimPlotsLoaded?: Promise<void>;
  __craterclaimPlotsRevision?: number;
};

function bucket() {
  const globalRef = globalThis as GlobalPlots;
  if (!globalRef.__craterclaimPlots) {
    globalRef.__craterclaimPlots = new Map();
  }
  return globalRef;
}

async function persist(plots: Map<string, PlotRecord>) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify([...plots.values()], null, 2), "utf8");
  } catch {
    // Ephemeral hosts (Vercel) cannot keep a local file.
  }
}

async function load() {
  const globalRef = bucket();
  if (globalRef.__craterclaimPlotsRevision !== GRID_REVISION) {
    globalRef.__craterclaimPlots = new Map();
    globalRef.__craterclaimPlotsLoaded = undefined;
    globalRef.__craterclaimPlotsRevision = GRID_REVISION;
  }
  if (!globalRef.__craterclaimPlotsLoaded) {
    globalRef.__craterclaimPlotsLoaded = readFile(DATA_FILE, "utf8")
      .then((raw) => {
        const rows = JSON.parse(raw) as PlotRecord[];
        for (const row of rows) {
          const plot = migratePlotToCurrentGrid({
            ...row,
            ownerId: row.ownerId ?? null,
            socialHandle: row.socialHandle ?? null,
          });
          globalRef.__craterclaimPlots?.set(plot.id, plot);
        }
        if (globalRef.__craterclaimPlots) {
          void persist(globalRef.__craterclaimPlots);
        }
      })
      .catch(() => undefined);
  }
  await globalRef.__craterclaimPlotsLoaded;
}

export function reservationMs() {
  return RESERVATION_MS;
}

export async function expireReservations(now = Date.now()) {
  await load();
  const plots = bucket().__craterclaimPlots!;
  let changed = false;

  for (const plot of plots.values()) {
    if (plot.status === "active" || plot.status === "suspended") continue;
    if (!plot.reservedUntil) continue;
    if (new Date(plot.reservedUntil).getTime() > now) continue;
    plots.delete(plot.id);
    changed = true;
  }

  if (changed) await persist(plots);
  return plots;
}

export async function listPlots() {
  const plots = await expireReservations();
  return [...plots.values()].sort((a, b) => {
    const aDate = a.claimDate ?? a.createdAt;
    const bDate = b.claimDate ?? b.createdAt;
    return bDate.localeCompare(aDate);
  });
}

export async function listOccupyingPlots() {
  const plots = await expireReservations();
  return [...plots.values()].filter(
    (plot) =>
      plot.status === "active" ||
      plot.status === "reserved" ||
      plot.status === "payment_pending" ||
      plot.status === "suspended",
  );
}

export async function listActivePlots() {
  await load();
  return [...bucket().__craterclaimPlots!.values()]
    .filter((plot) => plot.status === "active")
    .sort((a, b) => {
      const aDate = a.claimDate ?? a.createdAt;
      const bDate = b.claimDate ?? b.createdAt;
      return bDate.localeCompare(aDate);
    });
}

export async function getPlot(id: string) {
  const plots = await expireReservations();
  return plots.get(id) ?? null;
}

function toPublic(plot: PlotRecord): PlotRecord {
  return {
    ...plot,
    ownerId: null,
    paymentProvider: null,
    paymentId: null,
    moderationNotes: null,
  };
}

export async function listPublicPlots() {
  return (await listActivePlots()).map(toPublic);
}

export async function getPublicPlot(id: string) {
  await load();
  const plot = bucket().__craterclaimPlots!.get(id);
  return plot?.status === "active" ? toPublic(plot) : null;
}

export async function upsertPlot(plot: PlotRecord) {
  const plots = await expireReservations();
  plots.set(plot.id, plot);
  await persist(plots);
  return plot;
}

export async function nextPlotId() {
  const plots = await expireReservations();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const id = `CLM-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!plots.has(id)) return id;
  }
  return `CLM-${String(Date.now()).slice(-4)}`;
}
