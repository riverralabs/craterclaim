export type Zone = "standard" | "premium";

export type LunarFeatureType = "mare" | "crater" | "oceanus" | "pole" | "other";

export interface LunarFeature {
  id: string;
  name: string;
  type: LunarFeatureType;
  centerLat: number;
  centerLng: number;
  radiusDeg: number;
  isPremium: boolean;
}

export interface UV {
  u: number;
  v: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export interface PlotSelection {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
  centerLat: number;
  centerLng: number;
  featureName: string;
  zone: Zone;
  price: number;
}

export type PlotStatus = "reserved" | "payment_pending" | "active";

export interface PlotRecord {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
  centerLatitude: number;
  centerLongitude: number;
  lunarFeature: string;
  zone: Zone;
  status: PlotStatus;
  quotedPrice: number;
  pricePaid: number | null;
  claimDate: string | null;
  reservedUntil: string | null;
  name: string | null;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  ownerId: string | null;
  createdAt: string;
}

export type LandingMode = "idle" | "confirmed" | "flying" | "arrived";
