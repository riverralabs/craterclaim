import { ImageResponse } from "next/og";
import { getPlot } from "@/lib/plots/inventory";
import { renderShareCard } from "@/lib/plots/render-share-card";

export const runtime = "nodejs";
export const alt = "CraterClaim lunar deed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ plotId: string }> }) {
  const { plotId } = await params;
  const plot = await getPlot(plotId);
  if (!plot || plot.status !== "active") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#05060e",
            color: "#b7bcc6",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            letterSpacing: "0.2em",
          }}
        >
          CRATERCLAIM
        </div>
      ),
      size,
    );
  }
  return renderShareCard(plot);
}
