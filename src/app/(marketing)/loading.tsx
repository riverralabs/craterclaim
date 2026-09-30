"use client";

import { usePathname } from "next/navigation";
import { MoonStill } from "@/components/moon/MoonStill";

export default function Loading() {
  const pathname = usePathname();
  const body = pathname === "/mars" ? "mars" : "moon";

  return (
    <main className="relative h-dvh overflow-hidden bg-space">
      <MoonStill body={body} />
    </main>
  );
}
