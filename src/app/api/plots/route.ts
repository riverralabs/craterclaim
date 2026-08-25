import { NextResponse } from "next/server";
import { listActivePlots } from "@/lib/plots/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  const plots = await listActivePlots();
  return NextResponse.json({ plots });
}
