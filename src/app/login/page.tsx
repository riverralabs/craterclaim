import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Claim a plot",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  redirect("/?select=1");
}
