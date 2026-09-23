"use client";

import { useState } from "react";
import Link from "next/link";
import { updateLanding } from "@/lib/plots/guest-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm text-electric-white outline-none placeholder:text-lunar-silver/60 focus-visible:border-violet/60";

export function EditLandingForm({
  token,
  plotId,
  name,
  websiteUrl,
  socialHandle,
  logoUrl,
}: {
  token: string;
  plotId: string;
  name: string;
  websiteUrl: string;
  socialHandle: string;
  logoUrl: string | null;
}) {
  const [website, setWebsite] = useState(websiteUrl);
  const [social, setSocial] = useState(socialHandle);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);

    let uploaded: string | null = null;
    if (logoFile) {
      const body = new FormData();
      body.set("file", logoFile);
      const response = await fetch(`/api/plots/${plotId}/logo`, {
        method: "POST",
        headers: { "x-edit-token": token },
        body,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setPending(false);
        setError(payload.error ?? "Could not upload the logo.");
        return;
      }
      uploaded = payload.url;
    }

    const result = await updateLanding({
      token,
      websiteUrl: website,
      socialHandle: social,
      logoUrl: uploaded,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
      <p className="text-sm text-lunar-silver">
        {name} · {plotId}. The name, size, and place stay as they were claimed.
      </p>
      <label className="block text-sm">
        Website
        <input
          type="text"
          inputMode="url"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className={fieldClass}
          placeholder="https://"
        />
      </label>
      <label className="block text-sm">
        Social
        <input
          type="text"
          value={social}
          onChange={(event) => setSocial(event.target.value)}
          className={fieldClass}
          placeholder="@studio or profile URL"
        />
      </label>
      <label className="block text-sm">
        Replace logo
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={`${fieldClass} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-electric-white`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setLogoFile(file ?? null);
            setPreview(file ? URL.createObjectURL(file) : logoUrl);
          }}
        />
      </label>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="size-16 rounded-xl object-contain" />
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="text-sm text-gold">Saved. The public Moon updates within a few minutes.</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-electric-white px-5 text-sm text-space disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save landing"}
        </button>
        <Link
          href={`/plot/${plotId}`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 border-white/15")}
        >
          View landing
        </Link>
      </div>
    </form>
  );
}
