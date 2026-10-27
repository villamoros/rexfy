"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { publishListing } from "@/app/actions/listings";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import {
  AVAILABILITY,
  CATEGORIES,
  CONDITIONS,
  UNITS,
  availabilityLabel,
  formatPrice,
  formatQuantity,
  type Availability,
  type MaterialCategory,
  type MaterialCondition,
  type QuantityUnit,
} from "@/lib/listings";

const STEPS = [
  "Material",
  "Cantidad",
  "Ubicación",
  "Precio",
  "Revisión",
] as const;

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descripción",
  quantity: "Cantidad",
  min_order_quantity: "Cantidad mínima",
  available_from: "Fecha de disponibilidad",
  city: "Ciudad",
  price: "Precio",
  price_unit: "Unidad del precio",
};

type Company = { id: string; name: string };

export function PublishWizard({ companies }: { companies: Company[] }) {
  const [state, action, pending] = useActionState(publishListing, undefined);
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState<[string, string][]>([]);
  const [availability, setAvailability] = useState<Availability>("immediate");
  const [free, setFree] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  function next() {
    const section = sectionRefs.current[step];
    const fields =
      section?.querySelectorAll<HTMLInputElement>("input, select, textarea") ??
      [];
    const quantity =
      section?.querySelector<HTMLInputElement>("[name=quantity]");
    const minimum = section?.querySelector<HTMLInputElement>(
      "[name=min_order_quantity]",
    );
    minimum?.setCustomValidity(
      quantity &&
        minimum?.value &&
        Number(minimum.value) > Number(quantity.value)
        ? "La cantidad mínima no puede superar la cantidad disponible"
        : "",
    );
    for (const field of fields) {
      if (!field.reportValidity()) return;
    }
    if (step === STEPS.length - 2 && formRef.current)
      setSummary(buildSummary(new FormData(formRef.current)));
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  const section = (index: number, children: ReactNode) => (
    <section
      ref={(el) => {
        sectionRefs.current[index] = el;
      }}
      hidden={step !== index}
      className="flex flex-col gap-4"
    >
      {children}
    </section>
  );

  const serverFieldErrors = Object.entries(state?.fieldErrors ?? {});

  return (
    // Submitting through onSubmit (not the form's action prop) keeps every step's values
    // if the server rejects the listing, since React resets forms after an action.
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-6"
    >
      <ol className="flex gap-1.5" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-border"}`}
            title={label}
          />
        ))}
      </ol>
      <p className="text-sm text-muted">
        Paso {step + 1} de {STEPS.length} · {STEPS[step]}
      </p>

      {section(
        0,
        <>
          {companies.length > 1 ? (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Empresa que publica</span>
              <select name="company_id" className="input text-base">
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="company_id" value={companies[0].id} />
          )}
          <Choices
            legend="¿Qué tipo de residuo tienes?"
            name="category"
            options={CATEGORIES as Record<MaterialCategory, string>}
            defaultValue="plastic"
            grid
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
            <span className="font-medium">
              Descripción técnica del material
            </span>
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
        </>,
      )}

      {section(
        1,
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
                  className="accent-brand-strong"
                />
                {label}
              </label>
            ))}
          </fieldset>
          {availability === "specific_date" && (
            <Field
              label="Disponible desde"
              name="available_from"
              type="date"
              required
            />
          )}
        </>,
      )}

      {section(
        2,
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
        </>,
      )}

      {section(
        3,
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
          {!free && (
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
            <span className="font-medium">
              Condiciones adicionales (opcional)
            </span>
            <textarea
              name="conditions"
              rows={3}
              maxLength={2000}
              className="input text-base"
            />
          </label>
        </>,
      )}

      {section(
        4,
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
            Tu publicación será visible de inmediato en el marketplace.
          </p>
          <FormMessage message={state?.message} />
          {serverFieldErrors.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-warn">
              {serverFieldErrors.map(([field, msg]) => (
                <li key={field}>
                  {FIELD_LABELS[field] ?? field}: {msg}
                </li>
              ))}
            </ul>
          )}
        </>,
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn btn-secondary"
          >
            Atrás
          </button>
        )}
        <div className="flex flex-1 flex-col">
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn btn-primary">
              Siguiente →
            </button>
          ) : (
            <SubmitButton pending={pending}>Publicar</SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}

function buildSummary(data: FormData): [string, string][] {
  const get = (name: string) => String(data.get(name) ?? "").trim();
  const unit = get("quantity_unit") as QuantityUnit;
  const rows: [string, string][] = [
    ["Material", CATEGORIES[get("category") as MaterialCategory]],
    ["Título", get("title")],
    ["Estado", CONDITIONS[get("condition") as MaterialCondition]],
    ["Cantidad", formatQuantity(Number(get("quantity")), unit)],
  ];
  if (get("min_order_quantity"))
    rows.push([
      "Mínimo de compra",
      formatQuantity(Number(get("min_order_quantity")), unit),
    ]);
  rows.push(
    [
      "Disponibilidad",
      availabilityLabel({
        availability: get("availability") as Availability,
        available_from: get("available_from") || null,
      }),
    ],
    ["Ubicación", get("city")],
    ["Retiro en sitio", data.get("pickup_allowed") === "on" ? "Sí" : "No"],
    [
      "Precio",
      formatPrice({
        pricing_type: get("pricing_type") === "free" ? "free" : "paid",
        price: get("price") ? Number(get("price")) : null,
        price_unit: (get("price_unit") || null) as QuantityUnit | null,
      }) + (data.get("price_negotiable") === "on" ? " · Negociable" : ""),
    ],
    ["Oferta", data.get("is_recurring") === "on" ? "Recurrente" : "Puntual"],
  );
  return rows;
}

function Choices<T extends string>({
  legend,
  name,
  options,
  defaultValue,
  grid = false,
}: {
  legend: string;
  name: string;
  options: Record<T, string>;
  defaultValue: T;
  grid?: boolean;
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
            className="accent-brand-strong"
          />
          {label}
        </label>
      ))}
    </fieldset>
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
        className="mt-1 accent-brand-strong"
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
      <select
        name={name}
        defaultValue={defaultValue}
        className="input text-base"
      >
        {Object.entries(UNITS).map(([value, unitLabel]) => (
          <option key={value} value={value}>
            {unitLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
