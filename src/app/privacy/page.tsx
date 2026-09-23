import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { OPERATOR_EMAIL, OPERATOR_MAILTO, OPERATOR_NAME } from "@/lib/legal/operator";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CraterClaim handles plot, email, and payment data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Legal" title="Privacy." updated="23 September 2026">
      <p>
        CraterClaim is a public map operated by {OPERATOR_NAME}. What you put on a landing is
        meant to be seen. This notice explains the smaller set of data we keep so you can pay
        and come back to your plot. Contact:{" "}
        <a href={OPERATOR_MAILTO}>{OPERATOR_EMAIL}</a>.
      </p>

      <h2>Who holds what</h2>
      <p>
        Lemon Squeezy processes payment and holds card and billing details. We receive the email
        address from that checkout. We do not create a password account for buyers. PostHog may
        record product analytics if enabled. Resend sends the landing card and edit link if
        enabled. Sentry records application errors and a sample of performance traces so we can
        fix outages. Supabase stores plots and logos.
      </p>

      <h2>What we store</h2>
      <p>
        Checkout email, plots (geometry, name, description, links, logo, status, price, payment
        id), a private edit secret, moderation notes, and basic event logs (claim, payment,
        suspend). Public plot pages show the landing you published. They do not show your email.
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
        to remove your email from our records; we may keep payment and moderation records as
        required for disputes, tax, or abuse prevention.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live you may access, correct, delete, or export personal data,
        or object to some processing. Public plot content you chose to publish may remain as a
        historical map entry unless we agree to remove it. Write to{" "}
        <a href={OPERATOR_MAILTO}>{OPERATOR_EMAIL}</a>, or use the email on your receipt.
      </p>

      <h2>Children</h2>
      <p>CraterClaim is not directed at children under 16. Do not claim a plot if you are younger.</p>

      <p>
        See also the <Link href="/terms">terms</Link> and <Link href="/refunds">refund policy</Link>.
      </p>
    </LegalPage>
  );
}
