import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for CraterClaim digital lunar plots.",
};

export default function TermsPage() {
  return (
    <LegalPage kicker="Legal" title="Terms of use." updated="26 August 2026">
      <p>
        These terms are the agreement between you and the operator of CraterClaim (“we”, “us”)
        when you visit the site, create an account, or claim a digital lunar plot. By using the
        service you accept them. If you do not, do not claim a plot.
      </p>

      <h2>What CraterClaim is</h2>
      <p>
        CraterClaim is a public digital map of the Moon. A “plot” is a rectangle on that map. It
        is a novelty record: a name, optional logo, optional link, and coordinates. It is not
        real property, not a land title, not a mineral right, not an investment, and not
        advertising inventory. We do not sell physical lunar land. We do not promise visitors,
        clicks, rankings, leads, or sales.
      </p>

      <h2>Accounts</h2>
      <p>
        You sign in with Google, Apple, or X. We do not issue passwords for buyer accounts. You
        are responsible for that provider account. Plots you pay for are attached to that
        sign-in. We may suspend an account that breaks these terms or the{" "}
        <Link href="/guidelines">content rules</Link>.
      </p>

      <h2>Claims and payment</h2>
      <p>
        Prices are calculated on the server from plot size and zone (Standard or Premium). A
        reservation lasts 15 minutes. Payment is processed by Lemon Squeezy. A plot becomes
        active only after we receive a verified payment webhook. Until then the rectangle can
        expire and return to the map.
      </p>
      <p>
        Digital plots are supplied immediately when payment is confirmed: they appear on the
        public Moon and on a public plot page. By checking the claim boxes you ask us to start
        that supply at once and acknowledge that you lose any statutory right to withdraw from
        the purchase, including under EU/EEA/UK consumer rules for digital content.
      </p>

      <h2>Refunds</h2>
      <p>
        Purchases are final. We do not offer refunds anywhere, including the EU, EEA, and UK,
        except where a statute still forces one after the withdrawal waiver above. See the{" "}
        <Link href="/refunds">refund policy</Link>.
      </p>

      <h2>Your content</h2>
      <p>
        You grant us a worldwide, royalty-free licence to host, display, and share the name,
        logo, description, and links you attach to a plot, including in share images. You must
        have the right to use that material. We may remove or suspend content under the content
        rules. Suspended plots leave the public Moon but keep the rectangle occupied.
      </p>

      <h2>Limitation</h2>
      <p>
        The service is provided as available. The Moon map, textures, coordinates, and feature
        names are approximations. To the fullest extent allowed by law we are not liable for
        lost profits, lost data, or indirect loss, and our total liability for a plot is the
        amount you paid for that plot.
      </p>

      <h2>Other</h2>
      <p>
        We may change prices, zones, or these terms for future purchases. The version accepted
        at checkout applies to that plot. Governing law is the law of the place where the
        operator is established, without limiting non-waivable consumer rights in your country.
      </p>
    </LegalPage>
  );
}
