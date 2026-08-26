import { LUNAR_FEATURES } from "@/lib/moon/regions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LunarFeature, LunarFeatureType } from "@/types";

type FeatureRow = {
  id: string;
  name: string;
  type: string | null;
  center_lat: number | null;
  center_lng: number | null;
  radius_deg: number | null;
  is_premium: boolean;
};

function fromRow(row: FeatureRow): LunarFeature | null {
  if (row.center_lat == null || row.center_lng == null || row.radius_deg == null) return null;
  return {
    id: row.id,
    name: row.name,
    type: (row.type as LunarFeatureType) || "other",
    centerLat: row.center_lat,
    centerLng: row.center_lng,
    radiusDeg: row.radius_deg,
    isPremium: row.is_premium,
  };
}

let featureCache: { at: number; features: LunarFeature[] } | null = null;
const FEATURE_CACHE_MS = 5 * 60 * 1000;

export async function listLunarFeatures(): Promise<LunarFeature[]> {
  if (!isSupabaseConfigured()) return LUNAR_FEATURES;
  if (featureCache && Date.now() - featureCache.at < FEATURE_CACHE_MS) {
    return featureCache.features;
  }
  const admin = createAdminClient();
  if (!admin) return LUNAR_FEATURES;
  const { data, error } = await admin.from("lunar_features").select("*").order("name");
  if (error || !data?.length) return LUNAR_FEATURES;
  const features = (data as FeatureRow[]).map(fromRow).filter((row): row is LunarFeature => Boolean(row));
  const next = features.length ? features : LUNAR_FEATURES;
  featureCache = { at: Date.now(), features: next };
  return next;
}

export async function upsertLunarFeature(feature: LunarFeature) {
  const admin = createAdminClient();
  if (!admin) {
    const index = LUNAR_FEATURES.findIndex((item) => item.id === feature.id);
    if (index >= 0) LUNAR_FEATURES[index] = feature;
    return feature;
  }
  const { error } = await admin.from("lunar_features").upsert({
    id: feature.id,
    name: feature.name,
    type: feature.type,
    center_lat: feature.centerLat,
    center_lng: feature.centerLng,
    radius_deg: feature.radiusDeg,
    is_premium: feature.isPremium,
  });
  if (error) throw error;
  featureCache = null;
  return feature;
}
