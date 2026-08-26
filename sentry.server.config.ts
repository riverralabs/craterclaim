import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampler: ({ name, inheritOrSampleWith }) => {
    if (name.includes("/api/payments/webhook") || name.includes("/claim")) return 1;
    return inheritOrSampleWith(process.env.NODE_ENV === "development" ? 1 : 0.2);
  },
  includeLocalVariables: true,
  sendDefaultPii: false,
});
