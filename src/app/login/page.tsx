import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to CraterClaim to claim and manage digital lunar plots.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/claim";

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Account</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
            Sign in to claim.
          </h1>
          <p className="mt-4 max-w-lg leading-relaxed text-lunar-silver">
            Use your email. No password. Your landings stay attached to this account once
            Supabase is connected.
          </p>
          <LoginForm nextPath={nextPath} error={params.error} />
        </div>
        <Footer />
      </main>
    </>
  );
}
