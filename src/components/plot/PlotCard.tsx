import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HudFrame } from "@/components/ui/hud-frame";
import { formatLatLng } from "@/lib/moon/coordinates";
import type { Zone } from "@/types";
import { cn } from "@/lib/utils";

type PlotCardProps = {
  plotId: string;
  name: string;
  sizeLabel: string;
  featureName: string;
  latitude: number;
  longitude: number;
  claimDate: string;
  zone: Zone;
  logoUrl?: string | null;
  valueLabel?: string;
  variant?: "card" | "panel";
};

function formatClaimDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetaRow({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">{label}</span>
      <span className={cn("text-right text-sm tracking-[0.04em]", gold ? "font-heading text-gold" : "text-electric-white")}>
        {value}
      </span>
    </div>
  );
}

export function PlotCard({
  plotId,
  name,
  sizeLabel,
  featureName,
  latitude,
  longitude,
  claimDate,
  zone,
  logoUrl,
  valueLabel,
  variant = "card",
}: PlotCardProps) {
  const premium = zone === "premium";
  const glow = premium
    ? "shadow-[0_0_28px_rgba(224,184,79,0.55)]"
    : "shadow-[0_0_28px_rgba(124,125,255,0.5)]";

  return (
    <HudFrame accent={premium ? "gold" : "violet"} className={variant === "panel" ? "p-5" : "p-4"}>
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
        <p className="font-mono text-[10px] tracking-[0.32em] text-emerald-300 uppercase">Plot claimed</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className={cn("h-12 w-12 object-contain", glow)} />
        ) : (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center font-heading text-lg font-bold tracking-[0.2em] uppercase",
              premium ? "text-gold" : "text-violet",
              glow,
            )}
          >
            {name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold tracking-[0.16em] text-electric-white uppercase">{name}</p>
          <p
            className={cn(
              "mt-1 font-mono text-[10px] tracking-[0.28em] uppercase",
              premium ? "text-gold" : "text-violet",
            )}
          >
            {premium ? "Premium zone" : "Standard zone"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
        <MetaRow label="Plot ID" value={plotId} />
        <MetaRow label="Size" value={sizeLabel} />
        <MetaRow label="Location" value={featureName} />
        <MetaRow label="Coords" value={formatLatLng(latitude, longitude)} />
        {valueLabel ? <MetaRow label="Value" value={valueLabel} gold={premium} /> : null}
        <MetaRow label="Claimed" value={formatClaimDate(claimDate)} />
      </div>

      <Button
        asChild
        size="lg"
        className={cn(
          "mt-5 min-h-11 w-full cursor-pointer font-heading text-xs tracking-[0.24em] uppercase",
          variant === "panel"
            ? "bg-gradient-to-r from-violet to-[#9b6dff] text-electric-white hover:from-violet hover:to-violet"
            : "border border-white/15 bg-transparent text-electric-white hover:bg-white/5",
        )}
        variant={variant === "panel" ? "default" : "outline"}
      >
        <Link href={`/plot/${plotId}`}>{variant === "panel" ? "View your plot" : "View landing"}</Link>
      </Button>
    </HudFrame>
  );
}
