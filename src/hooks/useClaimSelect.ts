"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMoonStore } from "@/lib/store/moon-store";

export function useClaimSelect() {
  const pathname = usePathname();
  const router = useRouter();
  const enterSelectMode = useMoonStore((state) => state.enterSelectMode);

  return () => {
    if (pathname === "/") {
      enterSelectMode();
      return;
    }
    router.push("/?select=1");
  };
}
