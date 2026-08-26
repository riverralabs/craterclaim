"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clearPlotLogo, restorePlot, savePremiumRegion, suspendPlot } from "@/lib/admin/actions";
import { signOutAdmin } from "@/lib/admin/auth-actions";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/moon/pricing";
import { searchPlots } from "@/lib/plots/search";
import type { AdminUserRow } from "@/lib/admin/actions";
import type { PlotEvent } from "@/lib/plots/events";
import type { LunarFeature, PlotRecord } from "@/types";

type Tab = "plots" | "users" | "audit" | "regions";

export function AdminBoard({
  plots,
  users,
  events,
  features,
}: {
  plots: PlotRecord[];
  users: AdminUserRow[];
  events: PlotEvent[];
  features: LunarFeature[];
}) {
  const [tab, setTab] = useState<Tab>("plots");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(plots);
  const [regions, setRegions] = useState(features);

  const filtered = useMemo(() => searchPlots(rows, query), [query, rows]);

  async function run(
    plotId: string,
    action: (id: string) => Promise<{ ok: true; data: PlotRecord } | { ok: false; error: string }>,
  ) {
    setError(null);
    const result = await action(plotId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((current) => current.map((plot) => (plot.id === plotId ? result.data : plot)));
  }

  return (
    <div className="mt-8">
      <form action={signOutAdmin} className="mb-6">
        <Button type="submit" variant="outline" size="lg" className="min-h-11 cursor-pointer border-white/15">
          Sign out of admin
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(["plots", "users", "audit", "regions"] as const).map((item) => (
          <Button
            key={item}
            type="button"
            size="lg"
            variant={tab === item ? "default" : "outline"}
            className={
              tab === item
                ? "min-h-11 cursor-pointer bg-electric-white text-space"
                : "min-h-11 cursor-pointer border-white/15"
            }
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {tab === "plots" ? (
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            Search plots
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm"
              placeholder="CLM-1001, name, feature"
            />
          </label>
          <label className="block text-sm">
            Moderation note
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm"
              placeholder="Why this landing is suspended"
            />
          </label>
          {filtered.length === 0 ? (
            <p className="text-lunar-silver">No plots match.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((plot) => (
                <li key={plot.id} className="rounded-2xl border border-white/10 bg-charcoal/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-heading tracking-[0.08em] uppercase">{plot.name ?? plot.id}</p>
                      <p className="mt-1 font-mono text-xs tracking-[0.16em] text-lunar-silver uppercase">
                        {plot.id} · {plot.status} · {plot.width}×{plot.height} · {plot.lunarFeature}
                      </p>
                      {plot.websiteUrl ? (
                        <p className="mt-1 truncate text-xs text-lunar-silver">{plot.websiteUrl}</p>
                      ) : null}
                      {plot.moderationNotes ? (
                        <p className="mt-2 text-xs text-gold">{plot.moderationNotes}</p>
                      ) : null}
                    </div>
                    <p className="text-sm tabular-nums text-gold">
                      {plot.pricePaid != null ? formatUsd(plot.pricePaid) : formatUsd(plot.quotedPrice)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="lg" variant="outline" className="min-h-11 cursor-pointer border-white/15">
                      <Link href={`/plot/${plot.id}`}>Open</Link>
                    </Button>
                    {plot.status === "active" ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="min-h-11 cursor-pointer border-red-400/40 text-red-200"
                        onClick={() => void run(plot.id, (id) => suspendPlot(id, notes))}
                      >
                        Suspend
                      </Button>
                    ) : null}
                    {plot.status === "suspended" ? (
                      <Button
                        type="button"
                        size="lg"
                        className="min-h-11 cursor-pointer bg-electric-white text-space"
                        onClick={() => void run(plot.id, restorePlot)}
                      >
                        Restore
                      </Button>
                    ) : null}
                    {plot.logoUrl ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="min-h-11 cursor-pointer border-white/15"
                        onClick={() => void run(plot.id, clearPlotLogo)}
                      >
                        Remove logo
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "users" ? (
        <ul className="mt-6 space-y-2">
          {users.length === 0 ? (
            <p className="text-lunar-silver">No signed-in users yet.</p>
          ) : (
            users.map((user) => (
              <li key={user.id} className="rounded-xl border border-white/10 bg-charcoal/70 px-4 py-3">
                <p className="font-mono text-sm">{user.email ?? user.id}</p>
                <p className="mt-1 text-xs text-lunar-silver">
                  {user.plotCount} plot{user.plotCount === 1 ? "" : "s"}
                  {user.createdAt ? ` · ${new Date(user.createdAt).toLocaleDateString()}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "audit" ? (
        <ul className="mt-6 space-y-2">
          {events.length === 0 ? (
            <p className="text-lunar-silver">No events yet.</p>
          ) : (
            events.map((event) => (
              <li key={event.id} className="rounded-xl border border-white/10 bg-charcoal/70 px-4 py-3">
                <p className="font-heading tracking-[0.08em] uppercase">{event.eventType}</p>
                <p className="mt-1 font-mono text-xs text-lunar-silver">
                  {event.plotId ?? "map"} · {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "regions" ? (
        <ul className="mt-6 space-y-3">
          {regions.map((feature) => (
            <li key={feature.id} className="rounded-2xl border border-white/10 bg-charcoal/70 p-4">
              <p className="font-heading tracking-[0.08em] uppercase">{feature.name}</p>
              <form
                className="mt-3 flex flex-wrap items-end gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const isPremium = form.get("premium") === "on";
                  const radiusDeg = Number(form.get("radius"));
                  void savePremiumRegion(feature.id, isPremium, radiusDeg).then((result) => {
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setRegions((current) =>
                      current.map((item) => (item.id === feature.id ? result.data : item)),
                    );
                  });
                }}
              >
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="premium"
                    defaultChecked={feature.isPremium}
                    className="size-4 accent-gold"
                  />
                  Premium
                </label>
                <label className="text-sm">
                  Radius (deg)
                  <input
                    name="radius"
                    type="number"
                    step="0.5"
                    min="1"
                    max="40"
                    defaultValue={feature.radiusDeg}
                    className="mt-1 block w-28 rounded-xl border border-white/10 bg-space/60 px-3 py-2 text-sm"
                  />
                </label>
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-11 cursor-pointer bg-electric-white text-space"
                >
                  Save
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
