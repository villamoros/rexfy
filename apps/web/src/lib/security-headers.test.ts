import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("security headers", () => {
  it("blocks framing and MIME sniffing", () => {
    expect(securityHeaders).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    expect(securityHeaders).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
  });

  it("allows the Clerk and Sentry transport paths used by the application", () => {
    expect(contentSecurityPolicy).toContain("https://*.clerk.accounts.dev");
    expect(contentSecurityPolicy).toContain("https://challenges.cloudflare.com");
    expect(contentSecurityPolicy).toContain("connect-src 'self' https: wss:");
  });
});
