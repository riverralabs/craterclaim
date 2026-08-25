"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SharePlotButton({ plotId, name }: { plotId: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/plot/${plotId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · CraterClaim`, url });
        return;
      }
    } catch {
      // Fall through to clipboard if share is cancelled or unavailable.
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className="min-h-11 cursor-pointer border-white/15"
      onClick={() => void share()}
    >
      {copied ? "Link copied" : "Share plot"}
    </Button>
  );
}
