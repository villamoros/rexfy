import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RexFy",
  description:
    "Una red productiva: material recuperado y capacidad de manufactura entre empresas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}
