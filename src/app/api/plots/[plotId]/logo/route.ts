import { NextResponse } from "next/server";
import { getPlot } from "@/lib/plots/inventory";
import { getAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
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

export async function POST(request: Request, { params }: RouteProps) {
  const { plotId } = await params;
  const plot = await getPlot(plotId);
  if (!plot) {
    return NextResponse.json({ error: "Unknown plot." }, { status: 404 });
  }
  if (plot.status === "active" || plot.status === "suspended") {
    return NextResponse.json({ error: "This plot is already claimed." }, { status: 409 });
  }

  const user = await getAuthUser();
  if (isSupabaseConfigured()) {
    if (!user) return NextResponse.json({ error: "Sign in to upload a logo." }, { status: 401 });
    if (plot.ownerId && plot.ownerId !== user.id) {
      return NextResponse.json({ error: "This reservation belongs to another account." }, { status: 403 });
    }
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

  if (isSupabaseConfigured() && user) {
    const supabase = await createClient();
    const ext = LOGO_TYPES[file.type];
    const path = `${user.id}/${plotId}${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage.from("plot-logos").upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const { data } = supabase.storage.from("plot-logos").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await savePlotLogo(plotId, bytes, file.type);
  return NextResponse.json({ url: saved.url });
}
