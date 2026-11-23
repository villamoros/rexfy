"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import { Field, FormMessage } from "@/components/form";
import { MaterialIcon } from "@/components/icons";
import {
  AVAILABILITY,
  CATEGORIES,
  CONDITIONS,
  MAX_PHOTOS,
  UNITS,
  type Availability,
  type Listing,
  type MaterialCategory,
  type MaterialCondition,
  type QuantityUnit,
} from "@/lib/listings";

import { FIELD_LABELS, type Company } from "./model";
import { photoSelectionError, shrinkPhoto } from "./media";

export function MaterialStep({
  companies,
  listing,
}: {
  companies: Company[];
  listing?: Listing;
}) {
  return (
    <>
      {listing ? null : companies.length > 1 ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Empresa que publica</span>
          <select name="company_id" className="input text-base">
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="company_id" value={companies[0].id} />
      )}
      <Choices
        legend="¿Qué material quieres publicar?"
        name="category"
        options={CATEGORIES as Record<MaterialCategory, string>}
        defaultValue="plastic"
        grid
        icon={(value) => (
          <MaterialIcon category={value} className="size-5 shrink-0" />
        )}
      />
      <Field
        label="Título de la publicación"
        name="title"
        required
        minLength={5}
        maxLength={160}
        placeholder="Plástico PET post-industrial grado alimenticio"
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Descripción técnica del material</span>
        <textarea
          name="description"
          rows={4}
          maxLength={4000}
          placeholder="Material transparente, limpio y separado post proceso industrial."
          className="input text-base"
        />
      </label>
      <Choices
        legend="Estado del material"
        name="condition"
        options={CONDITIONS as Record<MaterialCondition, string>}
        defaultValue="clean_separated"
      />
      <Toggle
        name="is_recurring"
        label="¿Oferta recurrente?"
        hint="Generas este material de forma continua"
      />
      <PhotoInput already={listing?.images.length ?? 0} />
    </>
  );
}

export function QuantityStep({
  availability,
  setAvailability,
}: {
  availability: Availability;
  setAvailability: Dispatch<SetStateAction<Availability>>;
}) {
  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field
          label="Cantidad disponible"
          name="quantity"
          type="number"
          step="any"
          min="0.001"
          required
          inputMode="decimal"
          placeholder="4.5"
        />
        <UnitSelect name="quantity_unit" label="Unidad" />
      </div>
      <Field
        label="Cantidad mínima de compra (opcional)"
        name="min_order_quantity"
        type="number"
        step="any"
        min="0.001"
        inputMode="decimal"
        placeholder="1"
      />
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1.5 font-medium">Disponibilidad</legend>
        {Object.entries(AVAILABILITY).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2">
            <input
              type="radio"
              name="availability"
              value={value}
              checked={availability === value}
              onChange={() => setAvailability(value as Availability)}
              className="accent-brand"
            />
            {label}
          </label>
        ))}
      </fieldset>
      {availability === "specific_date" ? (
        <Field
          label="Disponible desde"
          name="available_from"
          type="date"
          required
        />
      ) : null}
    </>
  );
}

export function LocationStep() {
  return (
    <>
      <Field
        label="Ciudad / municipio"
        name="city"
        required
        minLength={2}
        placeholder="Bogotá D.C."
      />
      <Field
        label="Nombre de la instalación (opcional)"
        name="facility_name"
        placeholder="Planta Fontibón"
      />
      <p className="-mt-2 text-xs text-muted">
        La dirección exacta se comparte solo con compradores verificados.
      </p>
      <Toggle
        name="pickup_allowed"
        label="¿Permites retiro en sitio?"
        hint="El comprador puede recoger directamente en tu planta"
        defaultChecked
      />
    </>
  );
}

export function PriceStep({
  free,
  setFree,
}: {
  free: boolean;
  setFree: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <>
      <fieldset className="grid grid-cols-2 gap-2 text-sm">
        <legend className="mb-1.5 font-medium">Precio</legend>
        {[
          ["paid", "De pago"],
          ["free", "Gratuito"],
        ].map(([value, label]) => (
          <label
            key={value}
            className="flex cursor-pointer items-center justify-center card p-3 transition hover:border-brand/60 has-checked:border-brand has-checked:bg-brand-soft"
          >
            <input
              type="radio"
              name="pricing_type"
              value={value}
              checked={free === (value === "free")}
              onChange={() => setFree(value === "free")}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </fieldset>
      {free ? null : (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Field
              label="Precio por unidad (COP)"
              name="price"
              type="number"
              min="1"
              step="any"
              required
              inputMode="numeric"
              placeholder="850"
            />
            <UnitSelect name="price_unit" label="Por" defaultValue="kg" />
          </div>
          <Toggle
            name="price_negotiable"
            label="Precio negociable"
            hint="Aceptas ofertas por encima o debajo del precio publicado"
          />
        </>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Condiciones adicionales (opcional)</span>
        <textarea
          name="conditions"
          rows={3}
          maxLength={2000}
          className="input text-base"
        />
      </label>
    </>
  );
}

export function ReviewStep({
  summary,
  listing,
  message,
  fieldErrors = {},
}: {
  summary: [string, string][];
  listing?: Listing;
  message?: string;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <>
      <dl className="divide-y divide-border card text-sm">
        {summary.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">
        {listing?.status === "published"
          ? "Los cambios se verán de inmediato en el marketplace. Las cotizaciones ya enviadas conservan sus condiciones."
          : "Tu publicación será visible de inmediato en el marketplace."}
      </p>
      <FormMessage message={message} />
      {Object.keys(fieldErrors).length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-warn" role="alert">
          {Object.entries(fieldErrors).map(([field, error]) => (
            <li key={field}>
              {FIELD_LABELS[field] ?? field}: {error}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function Choices<T extends string>({
  legend,
  name,
  options,
  defaultValue,
  grid = false,
  icon,
}: {
  legend: string;
  name: string;
  options: Record<T, string>;
  defaultValue: T;
  grid?: boolean;
  icon?: (value: T) => React.ReactNode;
}) {
  return (
    <fieldset
      className={`text-sm ${grid ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "flex flex-col gap-2"}`}
    >
      <legend className="mb-1.5 font-medium">{legend}</legend>
      {(Object.entries(options) as [T, string][]).map(([value, label]) => (
        <label
          key={value}
          className="flex cursor-pointer items-center gap-2 card p-3 transition hover:border-brand/60 has-checked:border-brand has-checked:bg-brand-soft"
        >
          <input
            type="radio"
            name={name}
            value={value}
            defaultChecked={value === defaultValue}
            className="accent-brand"
          />
          {icon?.(value)}
          {label}
        </label>
      ))}
    </fieldset>
  );
}

function PhotoInput({ already }: { already: number }) {
  const room = MAX_PHOTOS - already;
  const [chosen, setChosen] = useState(0);
  const [shrinking, setShrinking] = useState(false);
  if (room <= 0) return null;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">Fotos del material (opcional, hasta {room})</span>
      <input
        type="file"
        name="photos"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={async (event) => {
          const input = event.currentTarget;
          const original = Array.from(input.files ?? []);
          setChosen(original.length);
          const selectionError = photoSelectionError(original, room);
          if (selectionError) {
            input.setCustomValidity(selectionError);
            return;
          }
          input.setCustomValidity("Espera a que terminemos de preparar las fotos");
          setShrinking(true);
          const files = await Promise.all(original.map(shrinkPhoto));
          const smaller = new DataTransfer();
          for (const file of files) smaller.items.add(file);
          input.files = smaller.files;
          setShrinking(false);
          input.setCustomValidity(photoSelectionError(files, room));
        }}
        aria-describedby="photo-status"
        className="input text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-sunken file:px-3 file:py-1.5 file:text-sm file:font-medium"
      />
      <span id="photo-status" className="text-muted" aria-live="polite">
        {shrinking
          ? "Preparando las fotos…"
          : chosen > 0
            ? `${chosen} ${chosen === 1 ? "foto lista" : "fotos listas"} para subir`
            : "Una buena foto es la mejor prueba de la calidad del material. JPG, PNG o WebP, 5 MB cada una."}
      </span>
    </label>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 card p-3 transition hover:border-brand/60 text-sm has-checked:border-brand has-checked:bg-brand-soft">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 accent-brand"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-muted">{hint}</span>
      </span>
    </label>
  );
}

function UnitSelect({
  name,
  label,
  defaultValue = "t",
}: {
  name: string;
  label: string;
  defaultValue?: QuantityUnit;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className="input text-base">
        {Object.entries(UNITS).map(([value, unitLabel]) => (
          <option key={value} value={value}>
            {unitLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
