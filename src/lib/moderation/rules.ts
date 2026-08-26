const BLOCKED_HOSTS = [
  "bit.ly",
  "tinyurl.com",
  "grabify.link",
  "iplogger.org",
];

const BLOCKED_PHRASES = [
  "child porn",
  "csam",
  "nigger",
  "kill yourself",
];

export const MODERATION_RULES = [
  "No hate, harassment, or slurs.",
  "No sexual or pornographic content.",
  "No impersonation of people, brands, or public figures.",
  "No scam, phishing, malware, or deceptive URLs.",
  "CraterClaim may suspend a landing that breaks these rules.",
] as const;

export function moderationViolation(input: {
  name: string;
  description?: string;
  websiteUrl?: string;
}) {
  const haystack = `${input.name} ${input.description ?? ""}`.toLowerCase();
  if (BLOCKED_PHRASES.some((phrase) => haystack.includes(phrase))) {
    return "That listing breaks CraterClaim’s content rules.";
  }

  if (input.websiteUrl) {
    try {
      const host = new URL(input.websiteUrl).hostname.replace(/^www\./, "").toLowerCase();
      if (BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
        return "That website is not allowed.";
      }
    } catch {
      return "Enter a valid website.";
    }
  }

  return null;
}
