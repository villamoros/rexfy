import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RexFy",
  description:
    "Una red productiva: material recuperado y capacidad de manufactura entre empresas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
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
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
