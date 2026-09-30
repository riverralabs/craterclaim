import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import type { PlotAccess } from "@/lib/plots/access";
import { plotBody } from "@/lib/worlds";
import type { BodyId, PlotRecord, PlotStatus, Zone } from "@/types";

const RESERVATION_MS = 15 * 60 * 1000;

const PUBLIC_COLUMNS =
  "id,body,x,y,width,height,pixel_count,center_latitude,center_longitude,lunar_feature,zone,status,quoted_price,price_paid,claim_date,reserved_until,name,description,website_url,social_handle,logo_url,created_at";

const PUBLIC_COLUMNS_LEGACY = PUBLIC_COLUMNS.replace("id,body,", "id,");

type PlotRow = {
  id: string;
  body?: string | null;
  owner_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  pixel_count: number;
  center_latitude: number;
  center_longitude: number;
  lunar_feature: string;
  zone: Zone;
  status: PlotStatus;
  quoted_price: number | string;
  price_paid: number | string | null;
  claim_date: string | null;
  reserved_until: string | null;
  name: string | null;
  description: string | null;
  website_url: string | null;
  social_handle: string | null;
  logo_url: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  moderation_notes: string | null;
  created_at: string;
};

type PublicPlotRow = Omit<PlotRow, "owner_id" | "payment_provider" | "payment_id" | "moderation_notes">;

function fromPublicRow(row: PublicPlotRow): PlotRecord {
  return fromRow({
    ...row,
    owner_id: null,
    payment_provider: null,
    payment_id: null,
    moderation_notes: null,
  });
}

function fromRow(row: PlotRow): PlotRecord {
  return {
    id: row.id,
    body: plotBody({ body: row.body }),
    ownerId: row.owner_id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    pixelCount: row.pixel_count,
    centerLatitude: row.center_latitude,
    centerLongitude: row.center_longitude,
    lunarFeature: row.lunar_feature,
    zone: row.zone,
    status: row.status,
    quotedPrice: Number(row.quoted_price),
    pricePaid: row.price_paid == null ? null : Number(row.price_paid),
    claimDate: row.claim_date,
    reservedUntil: row.reserved_until,
    name: row.name,
    description: row.description,
    websiteUrl: row.website_url,
    socialHandle: row.social_handle,
    logoUrl: row.logo_url,
    paymentProvider: row.payment_provider,
    paymentId: row.payment_id,
    moderationNotes: row.moderation_notes,
    createdAt: row.created_at,
  };
}

function missingBodyColumn(error: { message?: string } | null) {
  return Boolean(error?.message && /body/i.test(error.message));
}

type PublicQuery = PromiseLike<{ data: unknown; error: { message: string } | null }>;

async function readPublic(run: (columns: string) => PublicQuery) {
  const first = await run(PUBLIC_COLUMNS);
  if (!first.error) return first.data;
  if (!missingBodyColumn(first.error)) throw first.error;
  const second = await run(PUBLIC_COLUMNS_LEGACY);
  if (second.error) throw second.error;
  return second.data;
}

function toRow(plot: PlotRecord, includeBody = true) {
  const row: Record<string, unknown> = {
    id: plot.id,
    owner_id: plot.ownerId,
    x: plot.x,
    y: plot.y,
    width: plot.width,
    height: plot.height,
    pixel_count: plot.pixelCount,
    center_latitude: plot.centerLatitude,
    center_longitude: plot.centerLongitude,
    lunar_feature: plot.lunarFeature,
    zone: plot.zone,
    status: plot.status,
    quoted_price: plot.quotedPrice,
    price_paid: plot.pricePaid,
    claim_date: plot.claimDate,
    reserved_until: plot.reservedUntil,
    name: plot.name,
    description: plot.description,
    website_url: plot.websiteUrl,
    social_handle: plot.socialHandle,
    logo_url: plot.logoUrl,
    payment_provider: plot.paymentProvider ?? null,
    payment_id: plot.paymentId ?? null,
    moderation_notes: plot.moderationNotes ?? null,
  };
  if (includeBody) row.body = plotBody(plot) satisfies BodyId;
  return row;
}

async function db() {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return admin;
}

/** Cookie-free anon client so public reads can run inside the data cache. RLS limits it to active plots. */
function publicDb() {
  return createAnonClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listPublicPlots() {
  const data = await readPublic((columns) =>
    publicDb().from("plots").select(columns).eq("status", "active").order("claim_date", { ascending: false }),
  );
  return ((data ?? []) as PublicPlotRow[]).map(fromPublicRow);
}

export async function getPublicPlot(id: string) {
  const data = await readPublic((columns) =>
    publicDb().from("plots").select(columns).eq("id", id).eq("status", "active").maybeSingle(),
  );
  return data ? fromPublicRow(data as PublicPlotRow) : null;
}

export function reservationMs() {
  return RESERVATION_MS;
}

export async function expireReservations() {
  const client = await db();
  await client.rpc("expire_stale_plots");
}

export async function listPlots() {
  await expireReservations();
  const client = await db();
  const { data, error } = await client.from("plots").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PlotRow[]).map(fromRow);
}

export async function listOccupyingPlots() {
  await expireReservations();
  const client = await db();
  const { data, error } = await client
    .from("plots")
    .select("*")
    .in("status", ["active", "reserved", "payment_pending", "suspended"]);
  if (error) throw error;
  return ((data ?? []) as PlotRow[]).map(fromRow);
}

export async function listActivePlots() {
  const client = await db();
  const { data, error } = await client
    .from("plots")
    .select("*")
    .eq("status", "active")
    .order("claim_date", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PlotRow[]).map(fromRow);
}

export async function getPlot(id: string) {
  const client = await db();
  const { data, error } = await client.from("plots").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const plot = fromRow(data as PlotRow);
  const holdExpired =
    (plot.status === "reserved" || plot.status === "payment_pending") &&
    Boolean(plot.reservedUntil) &&
    new Date(plot.reservedUntil!).getTime() < Date.now();
  if (holdExpired) {
    await expireReservations();
    return null;
  }
  return plot;
}

export async function upsertPlot(plot: PlotRecord) {
  const client = await db();
  const first = await client.from("plots").upsert(toRow(plot)).select("*").single();
  if (!first.error) return fromRow(first.data as PlotRow);
  if (!missingBodyColumn(first.error) || plotBody(plot) !== "moon") throw first.error;
  const retry = await client.from("plots").upsert(toRow(plot, false)).select("*").single();
  if (retry.error) throw retry.error;
  return fromRow(retry.data as PlotRow);
}

function accessFromRow(row: {
  claim_token_hash: string | null;
  edit_token_hash: string | null;
  buyer_email: string | null;
  visitor_id: string | null;
}): PlotAccess {
  return {
    claimTokenHash: row.claim_token_hash,
    editTokenHash: row.edit_token_hash,
    buyerEmail: row.buyer_email,
    visitorId: row.visitor_id,
  };
}

export async function getPlotAccess(id: string): Promise<PlotAccess | null> {
  const client = await db();
  const { data, error } = await client
    .from("plots")
    .select("claim_token_hash,edit_token_hash,buyer_email,visitor_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return accessFromRow(data as {
    claim_token_hash: string | null;
    edit_token_hash: string | null;
    buyer_email: string | null;
    visitor_id: string | null;
  });
}

export async function setPlotAccess(id: string, patch: Partial<PlotAccess>) {
  const row: Record<string, string | null> = {};
  if (patch.claimTokenHash !== undefined) row.claim_token_hash = patch.claimTokenHash;
  if (patch.editTokenHash !== undefined) row.edit_token_hash = patch.editTokenHash;
  if (patch.buyerEmail !== undefined) row.buyer_email = patch.buyerEmail;
  if (patch.visitorId !== undefined) row.visitor_id = patch.visitorId;
  if (!Object.keys(row).length) return;
  const client = await db();
  const { error } = await client.from("plots").update(row).eq("id", id);
  if (error) throw error;
}

export async function countOpenHolds(visitorId: string) {
  const client = await db();
  const { count, error } = await client
    .from("plots")
    .select("id", { count: "exact", head: true })
    .eq("visitor_id", visitorId)
    .in("status", ["reserved", "payment_pending"])
    .gt("reserved_until", new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function countRateEvents(bucketName: string, sinceIso: string) {
  const client = await db();
  const { count, error } = await client
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucketName)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

export async function recordRateEvent(bucketName: string) {
  const client = await db();
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  await client.from("rate_events").delete().lt("created_at", cutoff);
  const { error } = await client.from("rate_events").insert({ bucket: bucketName });
  if (error) throw error;
}

export async function listPlotsByBuyerEmail(email: string) {
  const client = await db();
  const data = await readPublic((columns) =>
    client.from("plots").select(columns).eq("status", "active").eq("buyer_email", email.trim().toLowerCase()),
  );
  return ((data ?? []) as PublicPlotRow[]).map(fromPublicRow);
}

export async function getPlotByEditTokenHash(hash: string) {
  const client = await db();
  const data = await readPublic((columns) =>
    client.from("plots").select(columns).eq("edit_token_hash", hash).eq("status", "active").maybeSingle(),
  );
  return data ? fromPublicRow(data as PublicPlotRow) : null;
}

export async function nextPlotId() {
  const client = await db();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const id = `CLM-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const { data, error } = await client.from("plots").select("id").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return id;
  }
  return `CLM-${String(Date.now()).slice(-4)}`;
}
