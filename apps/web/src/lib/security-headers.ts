const clerk = [
  "https://*.clerk.com",
  "https://*.clerk.dev",
  "https://*.clerk.accounts.dev",
];
const clerkChallenge = "https://challenges.cloudflare.com";

const directives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${clerk.join(" ")} ${clerkChallenge}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* ${clerk.join(" ")}`,
  `frame-src 'self' ${clerk.join(" ")} ${clerkChallenge}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

export const contentSecurityPolicy = directives.join("; ");

export const securityHeaders: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];
