"use client";

import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { BrandLoader } from "@/components/brand-loader";

export function ClerkGate({ children }: { children: ReactNode }) {
  return (
    <>
      <ClerkLoading>
        <BrandLoader />
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </>
  );
}
