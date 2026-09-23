"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readOwnedIds } from "@/lib/plots/local";

type Landing = { id: string; name: string; editUrl: string | null };

export function YourLandings() {
  const [landings, setLandings] = useState<Landing[] | null>(null);

  useEffect(() => {
    const ids = readOwnedIds();
    const edits = new Map(
      ids.map((id) => [id, sessionStorage.getItem(`cc-edit-${id}`)] as const),
    );
    if (ids.length === 0) {
      setLandings([]);
      return;
    }

    let cancelled = false;
    void fetch("/api/plots")
      .then((response) => (response.ok ? response.json() : { plots: [] }))
      .then((data: { plots?: { id: string; name: string | null }[] }) => {
        if (cancelled) return;
        const names = new Map((data.plots ?? []).map((plot) => [plot.id, plot.name ?? plot.id]));
        setLandings(
          ids.map((id) => ({
            id,
            name: names.get(id) ?? id,
            editUrl: edits.get(id) ?? null,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLandings(ids.map((id) => ({ id, name: id, editUrl: edits.get(id) ?? null })));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!landings) return <p className="mt-8 text-lunar-silver">Loading landings from this browser…</p>;
  if (landings.length === 0) {
    return (
      <p className="mt-8 max-w-lg text-lunar-silver">
        Landings you claim in this browser show up here. On another device, use the email lookup below.
      </p>
    );
  }

  return (
    <ul className="mt-8 space-y-3">
      {landings.map((landing) => (
        <li key={landing.id} className="rounded-xl border border-white/10 bg-charcoal/70 px-4 py-3">
          <Link href={`/plot/${landing.id}`} className="block font-heading tracking-[0.08em] uppercase">
            {landing.name}
          </Link>
          <p className="mt-1 text-xs text-lunar-silver">{landing.id}</p>
          {landing.editUrl ? (
            <a href={landing.editUrl} className="mt-2 inline-flex min-h-11 items-center text-sm text-gold">
              Edit landing
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
