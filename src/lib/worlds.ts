import { MARS_FEATURES } from "@/lib/mars/regions";
import { LUNAR_FEATURES } from "@/lib/moon/regions";
import type { BodyId, LunarFeature } from "@/types";

/** Matches the Moon globe's opening yaw so longitude 0 faces the camera. */
const MOON_YAW = -Math.PI / 2;

export type { BodyId };

export type WorldConfig = {
  id: BodyId;
  name: string;
  adjective: string;
  title: string;
  subtitle: string;
  exploreLabel: string;
  rotateLabel: string;
  seeOnLabel: string;
  mapAlt: string;
  colorUrl: string;
  hiResUrl: string;
  hiResJpg: string;
  yaw: number;
  tint: string;
  stillClass: string;
  features: LunarFeature[];
};

export const WORLDS: Record<BodyId, WorldConfig> = {
  moon: {
    id: "moon",
    name: "Moon",
    adjective: "lunar",
    title: "Claim your place on the Moon",
    subtitle: "Digital lunar plots on a public Moon map. Not physical land, and not advertising.",
    exploreLabel: "Explore the Moon",
    rotateLabel: "Rotate Moon",
    seeOnLabel: "See on Moon",
    mapAlt: "Equirectangular Moon map",
    colorUrl: "/textures/moon/color.webp",
    hiResUrl: "/textures/moon/color-2k.webp",
    hiResJpg: "/textures/moon/color-2k.jpg",
    yaw: MOON_YAW,
    tint: "#f0ece6",
    stillClass: "",
    features: LUNAR_FEATURES,
  },
  mars: {
    id: "mars",
    name: "Mars",
    adjective: "Martian",
    title: "Claim your place on Mars",
    subtitle: "Digital Martian plots on a public Mars map. Not physical land, and not advertising.",
    exploreLabel: "Explore Mars",
    rotateLabel: "Rotate Mars",
    seeOnLabel: "See on Mars",
    mapAlt: "Equirectangular Mars map",
    colorUrl: "/textures/mars/color.webp",
    hiResUrl: "/textures/mars/color-2k.webp",
    hiResJpg: "/textures/mars/color-2k.jpg",
    yaw: 0,
    tint: "#ffffff",
    stillClass: "still-west",
    features: MARS_FEATURES,
  },
};

export function isBodyId(value: unknown): value is BodyId {
  return value === "moon" || value === "mars";
}

export function plotBody(plot: { body?: string | null }): BodyId {
  return plot.body === "mars" ? "mars" : "moon";
}

export function getWorld(body: BodyId) {
  return WORLDS[body];
}

export function worldPath(body: BodyId) {
  return body === "mars" ? "/mars" : "/";
}

export function withBody<T extends { body?: string | null }>(plot: T, fallback: BodyId = "moon"): T & { body: BodyId } {
  return { ...plot, body: isBodyId(plot.body) ? plot.body : fallback };
}

export function plotSummary(plot: { body?: string | null; zone: string; lunarFeature: string }) {
  const world = getWorld(plotBody(plot));
  return `A ${plot.zone} digital ${world.adjective} plot near ${plot.lunarFeature}.`;
}
