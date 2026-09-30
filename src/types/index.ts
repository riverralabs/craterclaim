export type Zone = "standard" | "premium";

export type BodyId = "moon" | "mars";

export type LunarFeatureType =
  | "mare"
  | "crater"
  | "oceanus"
  | "pole"
  | "volcano"
  | "canyon"
  | "basin"
  | "plain"
  | "other";

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

export type PlotStatus = "reserved" | "payment_pending" | "active" | "suspended" | "deleted";

export interface PlotRecord {
  id: string;
  /** Which globe this rectangle belongs to. Missing values are Moon plots. */
  body?: BodyId;
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
  socialHandle: string | null;
  logoUrl: string | null;
  ownerId: string | null;
  createdAt: string;
  paymentProvider?: string | null;
  paymentId?: string | null;
  moderationNotes?: string | null;
}

export type LandingMode = "idle" | "confirmed" | "flying" | "arrived";
