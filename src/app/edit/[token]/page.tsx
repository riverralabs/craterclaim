import type { Metadata } from "next";
import Link from "next/link";
import { EditLandingForm } from "@/components/plot/EditLandingForm";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getPlotByEditTokenHash } from "@/lib/plots/inventory";
import { hashSecret, SECRET_PATTERN } from "@/lib/plots/secrets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit landing",
  description: "Update a CraterClaim landing.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type EditPageProps = {
  params: Promise<{ token: string }>;
};

export default async function EditPage({ params }: EditPageProps) {
  const { token } = await params;
  const plot = SECRET_PATTERN.test(token) ? await getPlotByEditTokenHash(hashSecret(token)) : null;

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Landing</p>
          {plot ? (
            <>
              <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Edit your landing.</h1>
              <EditLandingForm
                token={token}
                plotId={plot.id}
                name={plot.name ?? plot.id}
                websiteUrl={plot.websiteUrl ?? ""}
                socialHandle={plot.socialHandle ?? ""}
                logoUrl={plot.logoUrl}
              />
            </>
          ) : (
            <>
              <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
                This edit link is no longer valid.
              </h1>
              <p className="mt-4 max-w-lg leading-relaxed text-lunar-silver">
                Request a new one with the email you used at checkout.
              </p>
              <Link href="/find" className="mt-6 inline-flex min-h-11 items-center text-gold">
                Find my landing
              </Link>
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
