"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useClaimSelect } from "@/hooks/useClaimSelect";
import { cn } from "@/lib/utils";
import { useMoonStore } from "@/lib/store/moon-store";

const WORLD_LINKS = [
  { href: "/", label: "Moon" },
  { href: "/mars", label: "Mars" },
] as const;

const NAV_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/search", label: "Search" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/recent", label: "Recent Claims" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const enterExploreMode = useMoonStore((state) => state.enterExploreMode);
  const enterSelect = useClaimSelect();

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-charcoal/55 px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-4">
        <Link href="/" className="flex min-h-11 min-w-0 shrink items-center gap-2.5 cursor-pointer">
          <Image
            src="/brand/logo.png"
            alt="CraterClaim"
            width={36}
            height={36}
            className="size-9 rounded-full"
            priority
          />
          <span className="hidden font-heading text-base font-semibold tracking-tight text-electric-white sm:inline sm:text-lg">
            CraterClaim
          </span>
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="Worlds">
          {WORLD_LINKS.map((link) => {
            const active = pathname === link.href;
            const className = cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm transition-colors duration-200",
              active
                ? "text-electric-white"
                : "text-lunar-silver hover:text-electric-white",
            );
            if (active) {
              return (
                <button key={link.href} type="button" className={className} onClick={enterExploreMode}>
                  {link.label}
                </button>
              );
            }
            return (
              <Link key={link.href} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            const className = cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm transition-colors duration-200",
              active
                ? "text-electric-white"
                : "text-lunar-silver hover:text-electric-white",
            );

            return (
              <Link key={link.href} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="lg"
            className="hidden min-h-11 cursor-pointer bg-electric-white px-4 text-space hover:bg-electric-white/90 sm:inline-flex"
            onClick={enterSelect}
          >
            Claim Your Plot
          </Button>
          <Button
            size="lg"
            className="min-h-11 cursor-pointer bg-electric-white px-3 text-sm text-space hover:bg-electric-white/90 sm:hidden"
            onClick={enterSelect}
          >
            Claim
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                className="min-h-11 min-w-11 cursor-pointer text-electric-white lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="border-white/10 bg-charcoal/95 text-electric-white backdrop-blur-xl"
            >
              <SheetHeader>
                <SheetTitle>CraterClaim</SheetTitle>
                <SheetDescription className="text-lunar-silver">
                  Claim your place on the Moon or Mars.
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-6" aria-label="Mobile">
                {WORLD_LINKS.map((link) => {
                  if (pathname === link.href) {
                    return (
                      <button
                        key={link.href}
                        type="button"
                        className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-left text-base text-electric-white transition-colors duration-200 hover:bg-white/5"
                        onClick={enterExploreMode}
                      >
                        {link.label}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-base text-electric-white transition-colors duration-200 hover:bg-white/5"
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-base text-electric-white transition-colors duration-200 hover:bg-white/5"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  size="lg"
                  className="mt-3 min-h-11 cursor-pointer bg-electric-white text-space hover:bg-electric-white/90"
                  onClick={enterSelect}
                >
                  Claim Your Plot
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
