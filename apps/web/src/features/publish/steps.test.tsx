import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Availability } from "@/lib/listings";

import {
  LocationStep,
  MaterialStep,
  PriceStep,
  QuantityStep,
  ReviewStep,
} from "./steps";

describe("publish steps", () => {
  it("renders the material fields independently", () => {
    render(<MaterialStep companies={[{ id: "company-1", name: "Acme" }]} />);
    expect(screen.getByLabelText("Título de la publicación")).toBeRequired();
    expect(screen.getByText("¿Qué material quieres publicar?")).toBeVisible();
  });

  it("offers a company selector when the user belongs to several", () => {
    render(
      <MaterialStep
        companies={[
          { id: "company-1", name: "Acme" },
          { id: "company-2", name: "Beta" },
        ]}
      />,
    );
    expect(screen.getByLabelText("Empresa que publica")).toHaveValue("company-1");
  });

  it("shows the date only for a specific availability", async () => {
    function Subject() {
      const [availability, setAvailability] = useState<Availability>("immediate");
      return (
        <QuantityStep
          availability={availability}
          setAvailability={setAvailability}
        />
      );
    }
    render(<Subject />);
    expect(screen.queryByLabelText("Disponible desde")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Fecha específica"));
    expect(screen.getByLabelText("Disponible desde")).toBeRequired();
  });

  it("removes paid price fields when the material is free", async () => {
    function Subject() {
      const [free, setFree] = useState(false);
      return <PriceStep free={free} setFree={setFree} />;
    }
    render(<Subject />);
    expect(screen.getByLabelText("Precio por unidad (COP)")).toBeVisible();
    await userEvent.click(screen.getByLabelText("Gratuito"));
    expect(screen.queryByLabelText("Precio por unidad (COP)")).not.toBeInTheDocument();
  });

  it("renders location and announces server errors in review", () => {
    const { rerender } = render(<LocationStep />);
    expect(screen.getByLabelText("Ciudad / municipio")).toBeRequired();
    rerender(
      <ReviewStep
        summary={[["Material", "Plástico"]]}
        message="No fue posible publicar"
        fieldErrors={{ title: "Muy corto" }}
      />,
    );
    expect(screen.getByText("No fue posible publicar")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByText(/Título: Muy corto/).closest("ul")).toHaveAttribute(
      "role",
      "alert",
    );
  });
});
