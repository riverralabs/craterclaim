export const MAX_OPEN_HOLDS = 2;
export const MAX_RESERVES_PER_HOUR = 8;
export const MAX_LOOKUPS_PER_HOUR = 5;
export const MAX_LOOKUP_IP_PER_HOUR = 20;

export function reservationBlock(openHolds: number, recentAttempts: number) {
  if (openHolds >= MAX_OPEN_HOLDS) {
    return "You already have two plots held. Finish checkout or wait 15 minutes.";
  }
  if (recentAttempts >= MAX_RESERVES_PER_HOUR) {
    return "Too many reservations from this browser. Try again in an hour.";
  }
  return null;
}
