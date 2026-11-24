import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import type { Metadata } from "next";

import { ClerkGate } from "@/components/clerk-gate";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "RexFy",
  description:
    "Marketplace B2B para publicar, comprar y transportar materiales recuperados en Colombia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const app = (
    <>
      {children}
      <SiteFooter />
    </>
  );
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {clerkEnabled ? (
          <ClerkProvider
            localization={esMX}
            signInUrl="/ingresar"
            signUpUrl="/registro"
            signInFallbackRedirectUrl="/panel"
            signUpFallbackRedirectUrl="/onboarding"
            appearance={{
              variables: {
                colorPrimary: "#0b1f3b",
                colorBackground: "#ffffff",
                fontFamily: "var(--font-manrope)",
                borderRadius: "0.5rem",
              },
            }}
          >
            <ClerkGate>{app}</ClerkGate>
          </ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
