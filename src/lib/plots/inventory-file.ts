import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { GRID_REVISION, migratePlotToCurrentGrid } from "@/lib/moon/grid";
import type { PlotAccess } from "@/lib/plots/access";
import type { PlotRecord } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "plots.json");
const RESERVATION_MS = 15 * 60 * 1000;

type StoredPlot = PlotRecord & Partial<PlotAccess>;

type RateEvent = { bucket: string; createdAt: number };

type GlobalPlots = typeof globalThis & {
  __craterclaimPlots?: Map<string, PlotRecord>;
  __craterclaimPlotsLoaded?: Promise<void>;
  __craterclaimPlotsRevision?: number;
  __craterclaimAccess?: Map<string, PlotAccess>;
  __craterclaimRates?: RateEvent[];
};

function bucket() {
  const globalRef = globalThis as GlobalPlots;
  if (!globalRef.__craterclaimPlots) {
    globalRef.__craterclaimPlots = new Map();
  }
  if (!globalRef.__craterclaimAccess) {
    globalRef.__craterclaimAccess = new Map();
  }
  if (!globalRef.__craterclaimRates) {
    globalRef.__craterclaimRates = [];
  }
  return globalRef;
}

function emptyAccess(): PlotAccess {
  return { claimTokenHash: null, editTokenHash: null, buyerEmail: null, visitorId: null };
}

function splitStored(row: StoredPlot) {
  const access: PlotAccess = {
    claimTokenHash: row.claimTokenHash ?? null,
    editTokenHash: row.editTokenHash ?? null,
    buyerEmail: row.buyerEmail ?? null,
    visitorId: row.visitorId ?? null,
  };
  const plot: PlotRecord = { ...row };
  delete (plot as StoredPlot).claimTokenHash;
  delete (plot as StoredPlot).editTokenHash;
  delete (plot as StoredPlot).buyerEmail;
  delete (plot as StoredPlot).visitorId;
  return { plot, access };
}

async function persist(plots: Map<string, PlotRecord>) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const access = bucket().__craterclaimAccess ?? new Map<string, PlotAccess>();
    const rows = [...plots.values()].map((plot) => ({ ...plot, ...(access.get(plot.id) ?? {}) }));
    await writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch {
    // Ephemeral hosts (Vercel) cannot keep a local file.
  }
}

async function load() {
  const globalRef = bucket();
  if (globalRef.__craterclaimPlotsRevision !== GRID_REVISION) {
    globalRef.__craterclaimPlots = new Map();
    globalRef.__craterclaimAccess = new Map();
    globalRef.__craterclaimPlotsLoaded = undefined;
    globalRef.__craterclaimPlotsRevision = GRID_REVISION;
  }
  if (!globalRef.__craterclaimPlotsLoaded) {
    globalRef.__craterclaimPlotsLoaded = readFile(DATA_FILE, "utf8")
      .then((raw) => {
        const rows = JSON.parse(raw) as StoredPlot[];
        for (const row of rows) {
          const split = splitStored(row);
          const plot = migratePlotToCurrentGrid({
            ...split.plot,
            ownerId: split.plot.ownerId ?? null,
            socialHandle: split.plot.socialHandle ?? null,
          });
          globalRef.__craterclaimPlots?.set(plot.id, plot);
          globalRef.__craterclaimAccess?.set(plot.id, split.access);
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
    bucket().__craterclaimAccess?.delete(plot.id);
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

export async function getPlotAccess(id: string): Promise<PlotAccess | null> {
  await load();
  if (!bucket().__craterclaimPlots!.has(id)) return null;
  return bucket().__craterclaimAccess!.get(id) ?? emptyAccess();
}

export async function setPlotAccess(id: string, patch: Partial<PlotAccess>) {
  await load();
  if (!bucket().__craterclaimPlots!.has(id)) return;
  const current = bucket().__craterclaimAccess!.get(id) ?? emptyAccess();
  bucket().__craterclaimAccess!.set(id, { ...current, ...patch });
  await persist(bucket().__craterclaimPlots!);
}

export async function countOpenHolds(visitorId: string) {
  await load();
  const now = Date.now();
  let count = 0;
  for (const plot of bucket().__craterclaimPlots!.values()) {
    if (bucket().__craterclaimAccess!.get(plot.id)?.visitorId !== visitorId) continue;
    if (plot.status !== "reserved" && plot.status !== "payment_pending") continue;
    if (!plot.reservedUntil || new Date(plot.reservedUntil).getTime() <= now) continue;
    count += 1;
  }
  return count;
}

export async function countRateEvents(bucketName: string, sinceIso: string) {
  const since = new Date(sinceIso).getTime();
  return bucket().__craterclaimRates!.filter(
    (event) => event.bucket === bucketName && event.createdAt >= since,
  ).length;
}

export async function recordRateEvent(bucketName: string) {
  const events = bucket().__craterclaimRates ?? [];
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const next = events.filter((event) => event.createdAt >= cutoff);
  next.push({ bucket: bucketName, createdAt: Date.now() });
  bucket().__craterclaimRates = next;
}

export async function listPlotsByBuyerEmail(email: string) {
  await load();
  const needle = email.trim().toLowerCase();
  return [...bucket().__craterclaimPlots!.values()].filter(
    (plot) =>
      plot.status === "active" &&
      bucket().__craterclaimAccess!.get(plot.id)?.buyerEmail === needle,
  );
}

export async function getPlotByEditTokenHash(hash: string) {
  await load();
  for (const [id, access] of bucket().__craterclaimAccess!) {
    if (access.editTokenHash !== hash) continue;
    const plot = bucket().__craterclaimPlots!.get(id);
    if (plot?.status === "active") return plot;
  }
  return null;
}

export async function nextPlotId() {
  const plots = await expireReservations();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const id = `CLM-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!plots.has(id)) return id;
  }
  return `CLM-${String(Date.now()).slice(-4)}`;
}
