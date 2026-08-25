import { cn } from "@/lib/utils";

type HudFrameProps = {
  children: React.ReactNode;
  className?: string;
  accent?: "violet" | "gold";
};

export function HudFrame({ children, className, accent = "violet" }: HudFrameProps) {
  const line = accent === "gold" ? "bg-gold" : "bg-violet";
  const glow =
    accent === "gold"
      ? "shadow-[0_0_28px_rgba(224,184,79,0.16)]"
      : "shadow-[0_0_28px_rgba(124,125,255,0.16)]";
  const border = accent === "gold" ? "border-gold/40" : "border-violet/40";

  return (
    <div
      className={cn(
        "relative border bg-[rgba(8,10,16,0.78)] text-electric-white backdrop-blur-md",
        border,
        glow,
        className,
      )}
    >
      <span className={cn("absolute top-[-1px] left-[-1px] h-3 w-3", line)} style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <span className={cn("absolute top-[-1px] right-[-1px] h-3 w-3", line)} style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
      <span className={cn("absolute bottom-[-1px] left-[-1px] h-3 w-3", line)} style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }} />
      <span className={cn("absolute right-[-1px] bottom-[-1px] h-3 w-3", line)} style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
      {children}
    </div>
  );
}
