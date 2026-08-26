"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SharePlotButton({
  plotId,
  name,
  className,
}: {
  plotId: string;
  name: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "saved" | "error">("idle");

  async function share() {
    const origin = window.location.origin;
    const url = `${origin}/plot/${plotId}`;
    const title = `${name} · CraterClaim`;
    const imageUrl = `${origin}/plot/${plotId}/opengraph-image`;

    try {
      const image = await fetch(imageUrl);
      if (!image.ok) throw new Error("Card unavailable");
      const blob = await image.blob();
      const file = new File([blob], `${plotId}-lunar-deed.png`, { type: "image/png" });
      const payload = { title, text: title, url, files: [file] };

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(payload);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${plotId}-lunar-deed.png`;
      link.click();
      URL.revokeObjectURL(href);
      await navigator.clipboard.writeText(url);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 1800);
      } catch {
        setStatus("error");
        window.setTimeout(() => setStatus("idle"), 1800);
      }
    }
  }

  const label =
    status === "copied"
      ? "Link copied"
      : status === "saved"
        ? "Deed saved"
        : status === "error"
          ? "Could not share"
          : "Share deed";

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className={cn("min-h-11 cursor-pointer border-white/15", className)}
      onClick={() => void share()}
    >
      {label}
    </Button>
  );
}
