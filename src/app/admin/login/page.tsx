import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Admin</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Staff sign-in.</h1>
          <p className="mt-4 leading-relaxed text-lunar-silver">
            This is separate from Google, Apple, or X. Use the admin email and password from
            your environment variables.
          </p>
          <AdminLoginForm />
        </div>
        <Footer />
      </main>
    </>
  );
}
