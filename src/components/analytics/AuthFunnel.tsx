"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function AuthFunnel() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const method = params.get("signed_in");
    if (!method) return;
    trackEvent("sign_in", { method });
    const next = new URLSearchParams(params.toString());
    next.delete("signed_in");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [params, pathname, router]);

  return null;
}
