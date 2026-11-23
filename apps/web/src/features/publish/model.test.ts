import { describe, expect, it } from "vitest";

import type { Listing } from "@/lib/listings";

import {
  buildSummary,
  fillForm,
  minimumError,
  readForm,
  valuesOf,
} from "./model";

describe("publish model", () => {
  it("validates that the minimum does not exceed available quantity", () => {
    expect(minimumError("10", "11")).toMatch(/no puede superar/);
    expect(minimumError("10", "10")).toBe("");
    expect(minimumError("10", "")).toBe("");
  });

  it("builds the review summary from form data", () => {
    const data = new FormData();
    data.set("category", "plastic");
    data.set("title", "PET recuperado");
    data.set("condition", "clean_separated");
    data.set("quantity", "10");
    data.set("quantity_unit", "t");
    data.set("min_order_quantity", "2");
    data.set("availability", "immediate");
    data.set("city", "Cali");
    data.set("pickup_allowed", "on");
    data.set("pricing_type", "paid");
    data.set("price", "800");
    data.set("price_unit", "kg");
    data.set("price_negotiable", "on");
    data.set("is_recurring", "on");
    data.append("photos", new File(["image"], "pet.jpg"));

    expect(Object.fromEntries(buildSummary(data))).toMatchObject({
      Material: "Plástico",
      Título: "PET recuperado",
      Ubicación: "Cali",
      "Retiro en sitio": "Sí",
      Oferta: "Recurrente",
      "Fotos nuevas": "1 foto",
      "Mínimo de compra": "2 t",
    });
  });

  it("serializes controls and restores their values", () => {
    document.body.innerHTML = `
      <form>
        <input name="title" value="PET">
        <input name="recurring" type="checkbox" checked>
        <input name="pricing" type="radio" value="paid" checked>
        <input name="pricing" type="radio" value="free">
        <input name="ignored" type="hidden" value="secret">
        <select name="unit"><option value="kg" selected>kg</option></select>
      </form>`;
    const form = document.querySelector("form")!;
    expect(readForm(form)).toEqual({
      title: "PET",
      recurring: true,
      pricing: "paid",
      unit: "kg",
    });
    fillForm(form, {
      title: "Vidrio",
      recurring: false,
      pricing: "free",
      unit: "kg",
    });
    expect(readForm(form)).toMatchObject({
      title: "Vidrio",
      recurring: false,
      pricing: "free",
    });
  });

  it("maps a persisted listing back to editable form values", () => {
    const listing = {
      category: "metal",
      title: "Aluminio",
      description: "Limpio",
      condition: "clean_separated",
      is_recurring: true,
      quantity: 3,
      quantity_unit: "t",
      min_order_quantity: null,
      availability: "immediate",
      available_from: null,
      city: "Cali",
      facility_name: null,
      pickup_allowed: true,
      pricing_type: "free",
      price: null,
      price_unit: null,
      price_negotiable: false,
      conditions: null,
    } as Listing;
    expect(valuesOf(listing)).toMatchObject({
      category: "metal",
      quantity: "3",
      min_order_quantity: "",
      pricing_type: "free",
      price_unit: "kg",
    });
  });
});
