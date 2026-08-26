import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlotRecord, PlotStatus, Zone } from "@/types";

const RESERVATION_MS = 15 * 60 * 1000;

type PlotRow = {
  id: string;
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

function fromRow(row: PlotRow): PlotRecord {
  return {
    id: row.id,
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

function toRow(plot: PlotRecord) {
  return {
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
}

async function db() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
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

export async function listActivePlots() {
  await expireReservations();
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
  await expireReservations();
  const client = await db();
  const { data, error } = await client.from("plots").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as PlotRow) : null;
}

export async function upsertPlot(plot: PlotRecord) {
  const client = await db();
  const { data, error } = await client.from("plots").upsert(toRow(plot)).select("*").single();
  if (error) throw error;
  return fromRow(data as PlotRow);
}

export async function nextPlotId() {
  const plots = await listPlots();
  const used = new Set(plots.map((plot) => plot.id));
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const id = `CLM-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!used.has(id)) return id;
  }
  return `CLM-${String(Date.now()).slice(-4)}`;
}
