import { Resend } from "resend";
import type { PlotRecord } from "@/types";

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "CraterClaim <onboarding@resend.dev>";
}

export async function sendLandingLiveEmail(to: string, plot: PlotRecord) {
  if (!resendConfigured()) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const url = `${siteUrl()}/plot/${plot.id}`;
  const name = plot.name ?? plot.id;
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject: `Your landing is live — ${plot.id}`,
    html: `
      <div style="background:#05060e;color:#f4f6f8;font-family:Georgia,serif;padding:32px">
        <p style="letter-spacing:.28em;text-transform:uppercase;color:#8a93b0;font-size:11px">CraterClaim</p>
        <h1 style="font-size:28px;margin:12px 0 8px">Your landing is live.</h1>
        <p style="color:#b7bcc6;line-height:1.6">
          ${name} is on the public Moon. Digital plot ${plot.id} · ${plot.width}×${plot.height} · ${plot.lunarFeature}.
        </p>
        <p style="margin:24px 0">
          <a href="${url}" style="background:#f4f6f8;color:#05060e;text-decoration:none;padding:12px 18px;display:inline-block">
            View your landing
          </a>
        </p>
        <p style="color:#b7bcc6;font-size:13px;line-height:1.6">
          Not physical land. Purchases are final. <a href="${siteUrl()}/plot/${plot.id}" style="color:#e0b84f">Open plot page</a>
        </p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}
