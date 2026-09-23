import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { OPERATOR_EMAIL, OPERATOR_MAILTO } from "@/lib/legal/operator";

export const metadata: Metadata = {
  title: "Refunds",
  description: "CraterClaim does not offer refunds, including in the EU.",
};

export default function RefundsPage() {
  return (
    <LegalPage kicker="Legal" title="Refunds." updated="1 September 2026">
      <p>
        Digital lunar plots are supplied as soon as payment is confirmed. <strong>We do not
        provide refunds</strong> — not for change of mind, not for unused plots, and not because
        you are in the EU, EEA, UK, or any other region.
      </p>

      <h2>Immediate digital supply</h2>
      <p>
        When you claim, you confirm two things: this is a novelty digital plot, not land; and
        you want the landing created immediately. The plot appears on the public Moon and on a
        shareable page at that moment. That is full performance of a digital service.
      </p>
      <p>
        For customers with a 14-day cooling-off right in digital content, checking those boxes
        is your request to start performance and your acknowledgment that you lose the right to
        withdraw once the landing is live.
      </p>

      <h2>What we will not refund</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Change of mind after payment</li>
        <li>Selecting the “wrong” coordinates or size</li>
        <li>A name, logo, or link you later dislike</li>
        <li>Lack of visitors, press, or customers</li>
        <li>Moderation that hides a landing which broke the content rules</li>
      </ul>

      <h2>Chargebacks</h2>
      <p>
        If you open a chargeback, we may suspend the plot and give the payment processor the
        checkout record, webhook, and plot page. Do not buy a plot you do not intend to keep.
      </p>

      <h2>If the statute still requires it</h2>
      <p>
        If a non-waivable law still requires a refund after the above, email{" "}
        us at <a href={OPERATOR_MAILTO}>{OPERATOR_EMAIL}</a> with the plot ID and
        Lemon Squeezy receipt. That is the only path. See the <Link href="/terms">terms</Link>.
      </p>
    </LegalPage>
  );
}
