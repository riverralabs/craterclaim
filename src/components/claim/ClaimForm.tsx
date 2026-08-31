"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatUsd, PIXEL_PRICE } from "@/lib/moon/pricing";
import { formatLatLng } from "@/lib/moon/coordinates";
import { prepareLemonCheckout, reservePlot, startCheckout, submitClaim } from "@/lib/plots/actions";
import { trackEvent } from "@/lib/analytics";
import { useMoonStore } from "@/lib/store/moon-store";
import { cn } from "@/lib/utils";
import type { PlotRecord } from "@/types";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm text-electric-white outline-none placeholder:text-lunar-silver/60 focus-visible:border-violet/60";

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ClaimForm() {
  const router = useRouter();
  const selection = useMoonStore((state) => state.selection);
  const rememberPlot = useMoonStore((state) => state.rememberPlot);
  const [hydrated, setHydrated] = useState(false);
  const [reservation, setReservation] = useState<PlotRecord | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [novelty, setNovelty] = useState(false);
  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [lemonUrl, setLemonUrl] = useState<string | null>(null);
  const selectionKey = selection
    ? `${selection.x}:${selection.y}:${selection.width}:${selection.height}`
    : "";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await useMoonStore.persist.rehydrate();
      if (!cancelled) setHydrated(true);
    })();

    const existing = document.querySelector('script[src*="lemonsqueezy.com/js/lemon.js"]');
    if (existing) return () => {
      cancelled = true;
    };
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      cancelled = true;
      script.remove();
    };
  }, []);

  const runReserve = useCallback(async () => {
    const current = useMoonStore.getState().selection;
    if (!current) return { ok: false as const, error: "Select a plot first." };
    return reservePlot({
      x: current.x,
      y: current.y,
      width: current.width,
      height: current.height,
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !selectionKey) return;
    let cancelled = false;
    setReservation(null);
    setReserveError(null);
    setLemonUrl(null);

    void (async () => {
      const result = await runReserve();
      if (cancelled) return;
      if (!result.ok) {
        setReserveError(result.error);
        return;
      }
      setReservation(result.data);
      setReserveError(null);
      trackEvent("reserve", { plot_id: result.data.id });
      void prepareLemonCheckout(result.data.id).then((checkout) => {
        if (cancelled || !checkout.ok || checkout.data.mode !== "lemon" || !checkout.data.url) return;
        setLemonUrl(checkout.data.url);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, runReserve, selectionKey]);

  useEffect(() => {
    if (!reservation?.reservedUntil) return;
    const tick = () => {
      setRemaining(Math.max(0, new Date(reservation.reservedUntil!).getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [reservation]);

  const quote = reservation;
  const expired = Boolean(reservation && remaining <= 0);

  const preview = useMemo(() => {
    if (quote) return quote;
    if (!selection) return null;
    return {
      ...selection,
      quotedPrice: selection.price,
      lunarFeature: selection.featureName,
      centerLatitude: selection.centerLat,
      centerLongitude: selection.centerLng,
    };
  }, [quote, selection]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  async function onLogo(file: File | undefined) {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setFormError("Logo must be a PNG, JPG, WebP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Logo must be 5 MB or smaller.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setFormError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!reservation || expired) return;
    setPending(true);
    setFormError(null);

    if (!novelty || !consent) {
      setPending(false);
      setFormError("Both acknowledgements are required.");
      return;
    }

    let uploadedLogoUrl: string | null = null;
    if (logoFile) {
      const body = new FormData();
      body.set("file", logoFile);
      const uploaded = await fetch(`/api/plots/${reservation.id}/logo`, {
        method: "POST",
        body,
      });
      const payload = (await uploaded.json()) as { url?: string; error?: string };
      if (!uploaded.ok || !payload.url) {
        setPending(false);
        setFormError(payload.error ?? "Could not upload the logo.");
        return;
      }
      uploadedLogoUrl = payload.url;
    }

    const submitted = await submitClaim({
      plotId: reservation.id,
      name,
      description: "",
      websiteUrl,
      socialHandle,
      logoUrl: uploadedLogoUrl,
      noveltyAcknowledged: true,
      immediatePerformanceConsent: true,
      termsAccepted: true,
    });

    if (!submitted.ok) {
      setPending(false);
      setFormError(submitted.error);
      return;
    }

    const checkout = lemonUrl
      ? { ok: true as const, data: { mode: "lemon" as const, url: lemonUrl } }
      : await startCheckout(submitted.data.id);
    if (!checkout.ok) {
      setPending(false);
      setFormError(checkout.error);
      return;
    }

    trackEvent("checkout_started", { plot_id: submitted.data.id, mode: checkout.data.mode });

    if (checkout.data.mode === "lemon" && checkout.data.url) {
      const lemon = window as Window & {
        LemonSqueezy?: { Url: { Open: (url: string) => void } };
        createLemonSqueezy?: () => void;
      };
      lemon.createLemonSqueezy?.();
      if (lemon.LemonSqueezy?.Url.Open) {
        lemon.LemonSqueezy.Url.Open(checkout.data.url);
        setPending(false);
        return;
      }
      window.location.href = checkout.data.url;
      return;
    }

    if (!checkout.data.plot) {
      setPending(false);
      setFormError("Payment did not complete.");
      return;
    }

    rememberPlot(checkout.data.plot);
    router.push(`/?landing=${checkout.data.plot.id}`);
  }

  if (!hydrated) {
    return <p className="text-lunar-silver">Loading your selection…</p>;
  }

  if (!selection) {
    return (
      <div>
        <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Claim</p>
        <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
          Select a plot first.
        </h1>
        <p className="mt-4 leading-relaxed text-lunar-silver">
          Choose a rectangle on the Moon, then claim it. Digital plots only — not physical
          land, not ads.
        </p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 inline-flex min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90",
          )}
        >
          Explore the Moon
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Claim</p>
        <h1 className="font-heading text-4xl font-bold tracking-tight">Name this landing.</h1>
        <p className="text-sm leading-relaxed text-lunar-silver">
          {lemonUrl
            ? "Checkout opens Lemon Squeezy. Digital plots only — not physical land."
            : "Checkout is Lemon Squeezy when those keys are set. Until then, local mock checkout still lands a plot so we can test the loop. Digital plots only — not physical land."}{" "}
          <Link href="/guidelines" className="underline decoration-white/20 hover:text-electric-white">
            Content rules
          </Link>
          .
        </p>

        <label className="block text-sm">
          Name
          <input
            required
            minLength={2}
            maxLength={48}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
            placeholder="Enter the name"
          />
        </label>

        <label className="block text-sm">
          Website
          <input
            type="text"
            inputMode="url"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            className={fieldClass}
            placeholder="https://"
          />
        </label>

        <label className="block text-sm">
          Social (optional)
          <input
            type="text"
            value={socialHandle}
            onChange={(event) => setSocialHandle(event.target.value)}
            className={fieldClass}
            placeholder="@studio or profile URL"
          />
          <span className="mt-1 block text-xs text-lunar-silver">
            Shown on the share card if you add it. Sharing still works without it.
          </span>
        </label>

        <label className="block text-sm">
          Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className={`${fieldClass} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-electric-white`}
            onChange={(event) => void onLogo(event.target.files?.[0])}
          />
          <span className="mt-1 block text-xs text-lunar-silver">PNG, JPG, WebP, or GIF · up to 5 MB</span>
        </label>
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="Logo preview" className="size-16 rounded-xl object-cover" />
        ) : null}

        <LegalCheck checked={novelty} onChange={setNovelty}>
          I understand this is a digital novelty plot, not physical lunar land.
        </LegalCheck>

        <LegalCheck checked={consent} onChange={setConsent}>
          I agree this is an immediately performed digital service. I lose any cooling-off
          right once the landing is live, including in the EU.
        </LegalCheck>

        <LegalCheck checked={terms} onChange={setTerms}>
          I agree to the{" "}
          <Link href="/terms" className="underline decoration-white/20 hover:text-electric-white">
            Terms
          </Link>
          ,{" "}
          <Link href="/privacy" className="underline decoration-white/20 hover:text-electric-white">
            Privacy
          </Link>
          , and{" "}
          <Link href="/refunds" className="underline decoration-white/20 hover:text-electric-white">
            no-refund policy
          </Link>
          .
        </LegalCheck>

        {reserveError ? <p className="text-sm text-red-300">{reserveError}</p> : null}
        {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
        {expired ? (
          <p className="text-sm text-gold">Reservation expired. Select the plot again.</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={pending || !reservation || expired || Boolean(reserveError) || !novelty || !consent || !terms}
            className="min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90 disabled:opacity-60"
          >
            {pending
              ? "Opening checkout…"
              : !reservation && !reserveError
                ? "Reserving plot…"
                : `Pay ${formatUsd(preview?.quotedPrice ?? selection.price)}`}
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-11 cursor-pointer border-white/15">
            <Link href="/">Back to Moon</Link>
          </Button>
        </div>
      </form>

      {preview ? (
        <aside className="h-fit rounded-2xl border border-white/10 bg-charcoal/80 p-4">
          <p className="text-[11px] font-medium tracking-[0.18em] text-violet uppercase">
            {reservation ? "Held while you check out" : reserveError ? "Could not reserve" : "Selected plot"}
          </p>
          {reservation ? (
            <p className="mt-2 font-heading text-3xl tabular-nums">
              {formatRemaining(remaining)}
            </p>
          ) : reserveError ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-red-300">{reserveError}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 cursor-pointer border-white/15"
                onClick={() => {
                  setReserveError(null);
                  void (async () => {
                    const result = await runReserve();
                    if (!result.ok) {
                      setReserveError(result.error);
                      return;
                    }
                    setReservation(result.data);
                    void prepareLemonCheckout(result.data.id).then((checkout) => {
                      if (!checkout.ok || checkout.data.mode !== "lemon" || !checkout.data.url) return;
                      setLemonUrl(checkout.data.url);
                    });
                  })();
                }}
              >
                Try again
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-lunar-silver">Reserving this rectangle…</p>
          )}
          <dl className="mt-4 space-y-1.5 text-sm">
            <Row label="Plot" value={reservation?.id ?? "—"} />
            <Row label="Size" value={`${preview.width} × ${preview.height}`} />
            <Row label="Pixels" value={preview.pixelCount.toLocaleString("en-US")} />
            <Row
              label="Zone"
              value={`${preview.lunarFeature} · ${preview.zone === "premium" ? "Premium" : "Standard"}`}
              gold={preview.zone === "premium"}
            />
            <Row
              label="Rate"
              value={`${formatUsd(PIXEL_PRICE[preview.zone])}/px`}
              gold={preview.zone === "premium"}
            />
            <Row
              label="Center"
              value={formatLatLng(preview.centerLatitude, preview.centerLongitude)}
            />
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-lunar-silver">Total</span>
            <span className="font-heading text-xl">{formatUsd(preview.quotedPrice)}</span>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function LegalCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-lunar-silver">
      <span className="relative mt-0.5 inline-flex size-5 min-h-5 min-w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required
          className="absolute inset-0 z-10 size-5 cursor-pointer appearance-none rounded-[4px] border border-white/35 bg-space outline-none checked:border-gold checked:bg-gold focus-visible:ring-2 focus-visible:ring-gold/70"
        />
        {checked ? (
          <Check
            className="pointer-events-none relative z-20 size-3.5 text-space"
            strokeWidth={3}
            aria-hidden
          />
        ) : null}
      </span>
      <span>{children}</span>
    </label>
  );
}

function Row({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-lunar-silver">{label}</dt>
      <dd className={gold ? "text-right text-gold" : "text-right tabular-nums"}>{value}</dd>
    </div>
  );
}
