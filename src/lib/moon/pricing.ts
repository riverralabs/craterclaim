import { GRID_HEIGHT, GRID_WIDTH } from "@/lib/moon/coordinates";

export const PIXEL_PRICE = {
  standard: 0.5,
  premium: 1.0,
} as const;

export const TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT;
export const MIN_PLOT_SIZE = 10;
export const MIN_PLOT_PIXELS = MIN_PLOT_SIZE * MIN_PLOT_SIZE;

export type Zone = keyof typeof PIXEL_PRICE;

export function calculatePrice(pixelCount: number, zone: Zone) {
  return Number((pixelCount * PIXEL_PRICE[zone]).toFixed(2));
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
