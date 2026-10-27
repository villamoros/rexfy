import type { Metadata } from "next";

import { Card } from "@/components/form";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Crear cuenta · RexFy" };

export default function RegistroPage() {
  return (
    <Card
      title="Crea tu cuenta"
      subtitle="Después registras tu empresa en un minuto."
    >
      <SignupForm />
    </Card>
  );
}
