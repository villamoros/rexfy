import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field } from "./form";

describe("Field", () => {
  it("associates a validation error with its input", () => {
    render(<Field label="Ciudad" name="city" error="Es obligatoria" />);
    const input = screen.getByLabelText("Ciudad");
    const error = screen.getByText("Es obligatoria");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });
});
