import { cn } from "@/lib/utils";

type HudAccent = "violet" | "gold" | "danger" | "silver";

type HudFrameProps = {
  children: React.ReactNode;
  className?: string;
  accent?: HudAccent;
  opaque?: boolean;
};

const ACCENT: Record<HudAccent, { line: string; glow: string; border: string }> = {
  violet: {
    line: "bg-violet",
    glow: "shadow-[0_0_24px_rgba(138,147,176,0.12)]",
    border: "border-white/14",
  },
  gold: {
    line: "bg-gold",
    glow: "shadow-[0_0_28px_rgba(224,184,79,0.16)]",
    border: "border-gold/40",
  },
  danger: {
    line: "bg-red-400",
    glow: "shadow-[0_0_24px_rgba(220,56,56,0.22)]",
    border: "border-red-400/55",
  },
  silver: {
    line: "bg-lunar-silver",
    glow: "shadow-[0_0_20px_rgba(183,188,198,0.1)]",
    border: "border-white/16",
  },
};

export function HudFrame({
  children,
  className,
  accent = "violet",
  opaque = false,
}: HudFrameProps) {
  const tone = ACCENT[accent];

  return (
    <div
      className={cn(
        "relative border text-electric-white",
        opaque ? "bg-charcoal" : "bg-[rgba(10,12,18,0.92)] backdrop-blur-md",
        tone.border,
        tone.glow,
        className,
      )}
    >
      <span className={cn("absolute top-[-1px] left-[-1px] h-3 w-3", tone.line)} style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <span className={cn("absolute top-[-1px] right-[-1px] h-3 w-3", tone.line)} style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
      <span className={cn("absolute bottom-[-1px] left-[-1px] h-3 w-3", tone.line)} style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }} />
      <span className={cn("absolute right-[-1px] bottom-[-1px] h-3 w-3", tone.line)} style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
      {children}
    </div>
  );
}
