import { ImageResponse } from "next/og";
import { SHARE_CARD_SIZE, shareCardModel } from "@/lib/plots/share-card";
import type { PlotRecord } from "@/types";

async function logoDataUrl(logoUrl: string | null) {
  if (!logoUrl) return null;
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const url = logoUrl.startsWith("http")
      ? logoUrl
      : `${origin}${logoUrl.startsWith("/") ? logoUrl : `/${logoUrl}`}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 32 || buffer.byteLength > 5_000_000) return null;
    const mime = (response.headers.get("content-type") ?? "image/png").split(";")[0];
    if (!mime.startsWith("image/")) return null;
    try {
      const sharp = (await import("sharp")).default;
      const resized = await sharp(buffer)
        .resize(128, 128, { fit: "contain", background: { r: 18, g: 20, b: 26, alpha: 1 } })
        .png()
        .toBuffer();
      return `data:image/png;base64,${resized.toString("base64")}`;
    } catch {
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }
  } catch {
    return null;
  }
}

function Tick({
  placement,
  color,
}: {
  placement: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const pos =
    placement === "tl"
      ? { top: -1, left: -1, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }
      : placement === "tr"
        ? { top: -1, right: -1, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }
        : placement === "bl"
          ? { bottom: -1, left: -1, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }
          : { bottom: -1, right: -1, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` };

  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        width: 16,
        height: 16,
        ...pos,
      }}
    />
  );
}

function MetaRow({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 12 }}>
      <div style={{ display: "flex", fontSize: 13, letterSpacing: "0.28em", color: "#b7bcc6" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 20, color: gold ? "#e0b84f" : "#f4f6f8" }}>{value}</div>
    </div>
  );
}

export async function renderShareCard(plot: PlotRecord) {
  const card = shareCardModel(plot);
  const accent = card.premium ? "#e0b84f" : "#f4f6f8";
  const logo = await logoDataUrl(card.logoUrl);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#05060e",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            flexDirection: "column",
            width: 460,
            height: 590,
            backgroundColor: "#12141a",
            border: "1px solid rgba(255,255,255,0.16)",
            padding: "28px 28px 24px",
            color: "#f4f6f8",
          }}
        >
          <Tick placement="tl" color={accent} />
          <Tick placement="tr" color={accent} />
          <Tick placement="bl" color={accent} />
          <Tick placement="br" color={accent} />

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: 8,
                backgroundColor: "#34d399",
                marginRight: 10,
              }}
            />
            <div style={{ display: "flex", fontSize: 14, letterSpacing: "0.32em", color: "#6ee7b7" }}>
              PLOT CLAIMED
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 22 }}>
            <div
              style={{
                display: "flex",
                width: 64,
                height: 64,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                color: accent,
                fontSize: 28,
                letterSpacing: "0.12em",
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} width={64} height={64} alt="" />
              ) : (
                card.name.slice(0, 1)
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 16 }}>
              <div style={{ display: "flex", fontSize: 26, letterSpacing: "0.14em" }}>{card.name}</div>
              <div
                style={{
                  display: "flex",
                  marginTop: 6,
                  fontSize: 13,
                  letterSpacing: "0.26em",
                  color: card.premium ? "#e0b84f" : "#b7bcc6",
                }}
              >
                {card.zoneLabel.toUpperCase()}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 8,
              width: "100%",
            }}
          >
            <MetaRow label="PLOT ID" value={card.id} />
            <MetaRow label="SIZE" value={card.size} />
            <MetaRow label="LOCATION" value={card.feature} />
            <MetaRow label="COORDS" value={card.coords} />
            <MetaRow label="VALUE" value={card.value} gold={card.premium} />
            <MetaRow label="CLAIMED" value={card.claimed} />
            {card.social ? <MetaRow label="SOCIAL" value={card.social} /> : null}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              width: "100%",
              height: 48,
              backgroundColor: "#f4f6f8",
              color: "#05060e",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              letterSpacing: "0.28em",
            }}
          >
            VIEW PLOT
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              width: "100%",
              height: 48,
              border: "1px solid rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              letterSpacing: "0.28em",
            }}
          >
            VISIT LANDING SITE
          </div>
        </div>
      </div>
    ),
    { ...SHARE_CARD_SIZE },
  );
}
