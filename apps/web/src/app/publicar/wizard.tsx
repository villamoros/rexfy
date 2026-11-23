"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

import { saveListing } from "@/app/actions/listings";
import { SubmitButton } from "@/components/form";
import { DRAFT_KEY, parseDraft, writeDraft } from "@/features/publish/draft";
import {
  buildSummary,
  fillForm,
  minimumError,
  readForm,
  STEPS,
  valuesOf,
  type Company,
} from "@/features/publish/model";
import {
  LocationStep,
  MaterialStep,
  PriceStep,
  QuantityStep,
  ReviewStep,
} from "@/features/publish/steps";
import type { Availability, Listing } from "@/lib/listings";

const noSubscribe = () => () => {};

function readDraftSnapshot(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

export function PublishWizard({
  companies,
  listing,
}: {
  companies: Company[];
  listing?: Listing;
}) {
  const [state, action, pending] = useActionState(saveListing, undefined);
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState<[string, string][]>([]);
  const [availability, setAvailability] = useState<Availability>(
    listing?.availability ?? "immediate",
  );
  const [free, setFree] = useState(listing?.pricing_type === "free");
  const [draftHandled, setDraftHandled] = useState(false);
  const savedDraft = useSyncExternalStore(
    noSubscribe,
    readDraftSnapshot,
    () => null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const filled = useRef(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const offerDraft = !listing && !draftHandled && savedDraft !== null;

  function restoreDraft() {
    const values = parseDraft(savedDraft);
    if (!values) {
      writeDraft(localStorage, null);
      setDraftHandled(true);
      return;
    }
    flushSync(() => {
      setAvailability((values.availability as Availability) ?? "immediate");
      setFree(values.pricing_type === "free");
      setDraftHandled(true);
    });
    if (formRef.current) fillForm(formRef.current, values);
  }

  function discardDraft() {
    writeDraft(localStorage, null);
    setDraftHandled(true);
  }

  function rememberDraft() {
    if (!listing && formRef.current)
      writeDraft(localStorage, readForm(formRef.current));
  }

  function next() {
    const section = sectionRefs.current[step];
    const fields =
      section?.querySelectorAll<HTMLInputElement>("input, select, textarea") ??
      [];
    const quantity = section?.querySelector<HTMLInputElement>("[name=quantity]");
    const minimum = section?.querySelector<HTMLInputElement>(
      "[name=min_order_quantity]",
    );
    minimum?.setCustomValidity(
      minimumError(quantity?.value ?? "", minimum.value),
    );
    for (const field of fields) {
      if (!field.reportValidity()) return;
    }
    if (step === STEPS.length - 2 && formRef.current)
      setSummary(buildSummary(new FormData(formRef.current)));
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  }

  function section(index: number, children: ReactNode) {
    return (
      <section
        ref={(element) => {
          sectionRefs.current[index] = element;
        }}
        hidden={step !== index}
        aria-labelledby={`publish-step-${index}`}
        className="flex flex-col gap-4"
      >
        <h2 id={`publish-step-${index}`} className="sr-only">
          {STEPS[index]}
        </h2>
        {children}
      </section>
    );
  }

  return (
    <form
      ref={(form) => {
        formRef.current = form;
        if (form && listing && !filled.current) {
          fillForm(form, valuesOf(listing));
          filled.current = true;
        }
      }}
      onChange={rememberDraft}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(
          event.currentTarget,
          (event.nativeEvent as SubmitEvent).submitter,
        );
        if (!listing) writeDraft(localStorage, null);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-6"
    >
      {listing ? (
        <input type="hidden" name="listing_id" value={listing.id} />
      ) : null}
      {offerDraft ? (
        <div className="flex flex-wrap items-center justify-between gap-3 card p-4 text-sm">
          <span>Tienes una publicación sin terminar en este dispositivo.</span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={discardDraft}
              className="btn btn-secondary text-sm"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={restoreDraft}
              className="btn btn-primary text-sm"
            >
              Retomar
            </button>
          </span>
        </div>
      ) : null}
      <ol className="flex gap-1.5" aria-label="Progreso de publicación">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-brand" : "bg-border"}`}
            title={label}
          >
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted" aria-live="polite">
        Paso {step + 1} de {STEPS.length} · {STEPS[step]}
      </p>

      {section(0, <MaterialStep companies={companies} listing={listing} />)}
      {section(
        1,
        <QuantityStep
          availability={availability}
          setAvailability={setAvailability}
        />,
      )}
      {section(2, <LocationStep />)}
      {section(3, <PriceStep free={free} setFree={setFree} />)}
      {section(
        4,
        <ReviewStep
          summary={summary}
          listing={listing}
          message={state?.message}
          fieldErrors={state?.fieldErrors}
        />,
      )}

      <div className="flex gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className="btn btn-secondary"
          >
            Atrás
          </button>
        ) : null}
        <div className="flex flex-1 flex-col">
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn btn-primary">
              Siguiente →
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <SubmitButton pending={pending}>
                {listing?.status === "published" ? "Guardar cambios" : "Publicar"}
              </SubmitButton>
              {listing?.status !== "published" ? (
                <button
                  type="submit"
                  name="intent"
                  value="draft"
                  disabled={pending}
                  className="btn btn-secondary"
                >
                  Guardar como borrador
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
