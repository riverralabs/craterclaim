import { NextResponse } from "next/server";
import { listPublicPlots } from "@/lib/plots/inventory";

export const revalidate = 300;

export async function GET() {
  const plots = await listPublicPlots();
  return NextResponse.json({ plots });
}
