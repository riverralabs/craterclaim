import { getWorld, type BodyId } from "@/lib/worlds";

export function MoonStill({ body = "moon" }: { body?: BodyId }) {
  const world = getWorld(body);
  return (
    <div className="moon-still pointer-events-none absolute inset-0 z-[5] bg-space" aria-hidden="true">
      <div className={`moon-still-orb ${world.stillClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={world.colorUrl}
          alt=""
          width={1024}
          height={512}
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </div>
  );
}
