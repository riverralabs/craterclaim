import type { LunarFeature } from "@/types";

/**
 * Premium Mars destinations. Centers are planetocentric, converted to signed
 * east longitude (−180…180) so they match the equirectangular map.
 *
 * Sources: USGS Gazetteer of Planetary Nomenclature (IAU) and NASA landing
 * sites. Radii are claim zones, the same way lunar maria and craters are
 * sized — large enough to find, smaller than the full geologic feature when
 * that feature spans a hemisphere.
 *
 *   Olympus Mons        18.65°N, 226.20°E   USGS 4453
 *   Valles Marineris    13.74°S, 300.80°E   USGS 6288
 *   Tharsis Montes      midpoint of Ascraeus, Pavonis, and Arsia Mons
 *   Noctis Labyrinthus   7.20°S, 258.70°E   USGS, west 101.3°
 *   Hellas Planitia     42.40°S,  70.50°E
 *   Syrtis Major Planum  8.40°N,  69.50°E
 *   Elysium Mons        25.00°N, 147.20°E
 *   Utopia Planitia     46.70°N, 117.50°E   Viking 2 region
 *   Chryse Planitia     27.00°N, 324.00°E   Viking 1 region
 *   Acidalia Planitia   49.80°N, 339.30°E
 *   Gale                5.40°S, 137.80°E    Curiosity
 *   Jezero              18.38°N,  77.58°E   Perseverance
 *   Schiaparelli        2.70°S,  16.70°E
 *   Planum Boreum / Planum Australe        polar ice caps
 */
export const MARS_FEATURES: LunarFeature[] = [
  {
    id: "olympus-mons",
    name: "Olympus Mons",
    type: "volcano",
    centerLat: 18.65,
    centerLng: -133.8,
    radiusDeg: 8,
    isPremium: true,
  },
  {
    id: "tharsis-montes",
    name: "Tharsis Montes",
    type: "volcano",
    centerLat: 0.7,
    centerLng: -112.6,
    radiusDeg: 12,
    isPremium: true,
  },
  {
    id: "valles-marineris",
    name: "Valles Marineris",
    type: "canyon",
    centerLat: -13.74,
    centerLng: -59.2,
    radiusDeg: 14,
    isPremium: true,
  },
  {
    id: "noctis-labyrinthus",
    name: "Noctis Labyrinthus",
    type: "canyon",
    centerLat: -7.2,
    centerLng: -101.3,
    radiusDeg: 6,
    isPremium: true,
  },
  {
    id: "hellas",
    name: "Hellas Planitia",
    type: "basin",
    centerLat: -42.4,
    centerLng: 70.5,
    radiusDeg: 14,
    isPremium: true,
  },
  {
    id: "syrtis-major",
    name: "Syrtis Major",
    type: "plain",
    centerLat: 8.4,
    centerLng: 69.5,
    radiusDeg: 8,
    isPremium: true,
  },
  {
    id: "elysium-mons",
    name: "Elysium Mons",
    type: "volcano",
    centerLat: 25,
    centerLng: 147.2,
    radiusDeg: 7,
    isPremium: true,
  },
  {
    id: "utopia",
    name: "Utopia Planitia",
    type: "plain",
    centerLat: 46.7,
    centerLng: 117.5,
    radiusDeg: 12,
    isPremium: true,
  },
  {
    id: "chryse",
    name: "Chryse Planitia",
    type: "plain",
    centerLat: 27,
    centerLng: -36,
    radiusDeg: 10,
    isPremium: true,
  },
  {
    id: "acidalia",
    name: "Acidalia Planitia",
    type: "plain",
    centerLat: 49.8,
    centerLng: -20.7,
    radiusDeg: 10,
    isPremium: true,
  },
  {
    id: "gale",
    name: "Gale",
    type: "crater",
    centerLat: -5.4,
    centerLng: 137.8,
    radiusDeg: 5,
    isPremium: true,
  },
  {
    id: "jezero",
    name: "Jezero",
    type: "crater",
    centerLat: 18.38,
    centerLng: 77.58,
    radiusDeg: 5,
    isPremium: true,
  },
  {
    id: "schiaparelli",
    name: "Schiaparelli",
    type: "crater",
    centerLat: -2.7,
    centerLng: 16.7,
    radiusDeg: 6,
    isPremium: true,
  },
  {
    id: "planum-boreum",
    name: "Planum Boreum",
    type: "pole",
    centerLat: 87,
    centerLng: 0,
    radiusDeg: 10,
    isPremium: true,
  },
  {
    id: "planum-australe",
    name: "Planum Australe",
    type: "pole",
    centerLat: -87,
    centerLng: 0,
    radiusDeg: 10,
    isPremium: true,
  },
];
