import { ImageResponse } from "next/og";

export const alt = "CraterClaim — Claim your place on the Moon.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#05060e",
          color: "#f4f6f8",
          padding: "64px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 18,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "#8a93b0",
          }}
        >
          CraterClaim
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p
            style={{
              margin: 0,
              fontSize: 72,
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Claim your place on the Moon.
          </p>
          <p style={{ marginTop: 24, fontSize: 28, color: "#b7bcc6", maxWidth: 820 }}>
            Digital lunar plots on a public map. Not physical land.
          </p>
        </div>
      </div>
    ),
    size,
  );
}
