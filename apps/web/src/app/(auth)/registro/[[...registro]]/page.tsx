import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { BrandLoader } from "@/components/brand-loader";

export const metadata: Metadata = { title: "Crear cuenta · RexFy" };

export default function RegistroPage() {
  return (
    <Suspense fallback={<BrandLoader overlay boundary />}>
      <SignUp />
    </Suspense>
  );
}
