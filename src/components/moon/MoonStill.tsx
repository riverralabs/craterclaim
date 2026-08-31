export function MoonStill() {
  return (
    <div className="moon-still pointer-events-none absolute inset-0 z-[5] bg-space" aria-hidden="true">
      <div className="moon-still-orb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/moon/color.webp"
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
