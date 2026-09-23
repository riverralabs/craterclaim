import { NextResponse } from "next/server";
import { getPlot, getPlotAccess } from "@/lib/plots/inventory";
import { secretsMatch } from "@/lib/plots/secrets";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAllowedLogoType,
  LOGO_TYPES,
  MAX_LOGO_BYTES,
  readPlotLogo,
  savePlotLogo,
} from "@/lib/plots/logo-storage";

type RouteProps = {
  params: Promise<{ plotId: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteProps) {
  const { plotId } = await params;
  const stored = await readPlotLogo(plotId);
  if (stored) {
    return new NextResponse(new Uint8Array(stored.bytes), {
      headers: {
        "Content-Type": stored.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const plot = await getPlot(plotId);
  if (plot?.logoUrl?.startsWith("data:")) {
    const match = plot.logoUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match && isAllowedLogoType(match[1])) {
      const bytes = Buffer.from(match[2], "base64");
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": match[1],
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  return NextResponse.json({ error: "Logo not found." }, { status: 404 });
}

async function storeLogo(plotId: string, bytes: Uint8Array, mimeType: string) {
  const admin = createAdminClient();
  const ext = LOGO_TYPES[mimeType];
  if (!ext) throw new Error("Logo must be a PNG, JPG, WebP, or GIF.");
  if (!admin) {
    const saved = await savePlotLogo(plotId, bytes, mimeType);
    return saved.url;
  }

  const path = `plots/${plotId}${ext}`;
  const { error } = await admin.storage.from("plot-logos").upload(path, bytes, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  await admin.storage.from("plot-logos").remove(
    Object.values(LOGO_TYPES)
      .filter((other) => other !== ext)
      .map((other) => `plots/${plotId}${other}`),
  );
  const { data } = admin.storage.from("plot-logos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function canUpload(plotId: string, request: Request) {
  const plot = await getPlot(plotId);
  if (!plot) return { ok: false as const, status: 404, error: "Unknown plot." };
  const access = await getPlotAccess(plotId);
  if (!access) return { ok: false as const, status: 404, error: "Unknown plot." };

  const editToken = request.headers.get("x-edit-token");
  if (editToken && plot.status === "active" && secretsMatch(editToken, access.editTokenHash)) {
    return { ok: true as const };
  }

  const claimToken = request.headers.get("x-claim-token");
  const open = plot.status === "reserved" || plot.status === "payment_pending";
  if (claimToken && open && secretsMatch(claimToken, access.claimTokenHash)) {
    return { ok: true as const };
  }

  return { ok: false as const, status: 403, error: "This upload is not allowed." };
}

export async function POST(request: Request, { params }: RouteProps) {
  const { plotId } = await params;
  const allowed = await canUpload(plotId, request);
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.error }, { status: allowed.status });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a logo image." }, { status: 400 });
  }
  if (!isAllowedLogoType(file.type)) {
    return NextResponse.json({ error: "Logo must be a PNG, JPG, WebP, or GIF." }, { status: 400 });
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Logo must be 5 MB or smaller." }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await storeLogo(plotId, bytes, file.type);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload the logo." },
      { status: 400 },
    );
  }
}
