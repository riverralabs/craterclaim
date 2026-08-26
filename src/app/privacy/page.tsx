import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CraterClaim handles account, plot, and payment data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Legal" title="Privacy." updated="26 August 2026">
      <p>
        CraterClaim is a public map. What you put on a landing is meant to be seen. This notice
        explains the smaller set of data we keep so you can sign in, pay, and come back to your
        plots.
      </p>

      <h2>Who holds what</h2>
      <p>
        Google, Apple, or X authenticate you. We receive an account id and, usually, an email
        address. We do not store your password. Lemon Squeezy processes payment and holds card
        and billing details. PostHog may record product analytics if enabled. Resend sends the
        “your landing is live” email if enabled. Supabase stores plots, logos, and the account
        id that owns them.
      </p>

      <h2>What we store</h2>
      <p>
        Account id, email from the sign-in provider, plots (geometry, name, description, links,
        logo, status, price, payment id), moderation notes, and basic event logs (claim,
        payment, suspend). Public plot pages show the landing you published.
      </p>

      <h2>Why</h2>
      <p>
        To run the map, attach a paid plot to you, prevent overlap, take payment, moderate
        content, send a confirmation email, and debug the product. Legal bases: contract
        (providing the plot you bought), legitimate interests (security, abuse), and consent
        where a provider or cookie requires it.
      </p>

      <h2>Sharing</h2>
      <p>
        We share data with the processors named above so the product can run. We do not sell
        personal data. Public landings are visible to anyone, including search engines.
      </p>

      <h2>Retention</h2>
      <p>
        Active plots stay while the map exists. Suspended plots stay occupied. You can ask us
        to close an account; we may keep payment and moderation records as required for
        disputes, tax, or abuse prevention.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live you may access, correct, delete, or export personal data,
        or object to some processing. Public plot content you chose to publish may remain as a
        historical map entry unless we agree to remove it. Contact us through the site or the
        email on your receipt.
      </p>

      <h2>Children</h2>
      <p>CraterClaim is not directed at children under 16. Do not claim a plot if you are younger.</p>

      <p>
        See also the <Link href="/terms">terms</Link> and <Link href="/refunds">refund policy</Link>.
      </p>
    </LegalPage>
  );
}
