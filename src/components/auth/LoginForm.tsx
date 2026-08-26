"use client";

import { OAuthButtons } from "@/components/auth/OAuthButtons";

export function LoginForm({ nextPath, error }: { nextPath: string; error?: string }) {
  return (
    <div>
      {error ? <p className="mt-6 max-w-md text-sm text-red-300">{error}</p> : null}
      <OAuthButtons nextPath={nextPath} />
    </div>
  );
}
