import Link from "next/link";
import { OPERATOR_EMAIL, OPERATOR_MAILTO, OPERATOR_NAME } from "@/lib/legal/operator";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-space px-4 py-8 text-sm text-lunar-silver">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-heading text-base text-electric-white">CraterClaim</p>
          <p className="mt-1 max-w-md leading-relaxed">
            Digital lunar plots on a public Moon map. Not physical land, not advertising,
            and not a promise of traffic or rankings.
          </p>
          <p className="mt-2 text-xs">
            {OPERATOR_NAME} · <a href={OPERATOR_MAILTO} className="hover:text-electric-white">{OPERATOR_EMAIL}</a>
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/how-it-works" className="cursor-pointer hover:text-electric-white">
            How It Works
          </Link>
          <Link href="/leaderboard" className="cursor-pointer hover:text-electric-white">
            Leaderboard
          </Link>
          <Link href="/recent" className="cursor-pointer hover:text-electric-white">
            Recent Claims
          </Link>
          <Link href="/account" className="cursor-pointer hover:text-electric-white">
            Your landings
          </Link>
          <Link href="/find" className="cursor-pointer hover:text-electric-white">
            Find a landing
          </Link>
          <Link href="/guidelines" className="cursor-pointer hover:text-electric-white">
            Content rules
          </Link>
          <Link href="/terms" className="cursor-pointer hover:text-electric-white">
            Terms
          </Link>
          <Link href="/privacy" className="cursor-pointer hover:text-electric-white">
            Privacy
          </Link>
          <Link href="/refunds" className="cursor-pointer hover:text-electric-white">
            Refunds
          </Link>
        </div>
      </div>
    </footer>
  );
}
