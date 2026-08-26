import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AdminBoard } from "@/components/admin/AdminBoard";
import {
  listAdminEvents,
  listAdminFeatures,
  listAdminPlots,
  listAdminUsers,
} from "@/lib/admin/actions";
import { getAdminSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [plots, users, events, features] = await Promise.all([
    listAdminPlots(),
    listAdminUsers(),
    listAdminEvents(),
    listAdminFeatures(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Admin</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Moderation.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-lunar-silver">
            Signed in as {session.email}. Suspend landings that break the rules. Suspended plots
            leave the public Moon but keep the rectangle held.
          </p>
          <AdminBoard
            plots={plots.ok ? plots.data : []}
            users={users.ok ? users.data : []}
            events={events.ok ? events.data : []}
            features={features.ok ? features.data : []}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
