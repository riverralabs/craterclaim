"use server";

import { redirect } from "next/navigation";
import {
  adminCredentialsConfigured,
  clearAdminSession,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/session";
import type { ActionResult } from "@/lib/plots/actions";

export async function signInAdmin(email: string, password: string): Promise<ActionResult<{ ok: true }>> {
  if (!adminCredentialsConfigured()) {
    return { ok: false, error: "Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET." };
  }
  if (!verifyAdminCredentials(email, password)) {
    return { ok: false, error: "Those admin credentials are wrong." };
  }
  await createAdminSession();
  return { ok: true, data: { ok: true } };
}

export async function signOutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
