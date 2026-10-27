import type { Metadata } from "next";

import { Card } from "@/components/form";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar · RexFy" };

export default function IngresarPage() {
  return (
    <Card title="Ingresa a RexFy">
      <LoginForm />
    </Card>
  );
}
