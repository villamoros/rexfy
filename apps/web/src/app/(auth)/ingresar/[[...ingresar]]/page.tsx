import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { BrandLoader } from "@/components/brand-loader";

export const metadata: Metadata = { title: "Ingresar · RexFy" };

export default function IngresarPage() {
  return (
    <Suspense fallback={<BrandLoader overlay boundary />}>
      <SignIn />
    </Suspense>
  );
}
