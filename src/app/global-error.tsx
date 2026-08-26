"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#05060e",
          color: "#f4f6f8",
          fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <p
            style={{
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#8a93b0",
              fontSize: 12,
              margin: 0,
            }}
          >
            CraterClaim
          </p>
          <h1 style={{ fontSize: 32, margin: "12px 0 8px" }}>Something broke on this Moon.</h1>
          <p style={{ color: "#b7bcc6", lineHeight: 1.6 }}>
            The error was recorded. Refresh, or go back to the map.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              marginTop: 24,
              minHeight: 44,
              alignItems: "center",
              background: "#f4f6f8",
              color: "#05060e",
              border: 0,
              padding: "0 20px",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
