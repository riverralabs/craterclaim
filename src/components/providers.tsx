"use client";

import { Suspense, useEffect } from "react";
import { AuthFunnel } from "@/components/analytics/AuthFunnel";
import { loadAnalytics } from "@/lib/analytics";

function useDeferredAnalytics() {
  useEffect(() => {
    const start = () => void loadAnalytics();
    if (window.requestIdleCallback) {
      const idle = window.requestIdleCallback(start, { timeout: 3000 });
      return () => window.cancelIdleCallback(idle);
    }
    const timeout = window.setTimeout(start, 1500);
    return () => window.clearTimeout(timeout);
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useDeferredAnalytics();

  return (
    <>
      <Suspense fallback={null}>
        <AuthFunnel />
      </Suspense>
      {children}
    </>
  );
}
