import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RexFy",
  description: "Marketplace B2B de materiales reciclables",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
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
              colorPrimary: "#0f6e56",
              colorBackground: "#fffdf7",
              borderRadius: "0.75rem",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
