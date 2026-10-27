import type { TransactionStatus } from "@/lib/deals";

const STEPS: { label: string; reachedAt: TransactionStatus[] }[] = [
  {
    label: "Acordada",
    reachedAt: ["agreed", "in_transit", "delivered", "completed"],
  },
  { label: "En tránsito", reachedAt: ["in_transit", "delivered", "completed"] },
  { label: "Entregada", reachedAt: ["delivered", "completed"] },
  { label: "Completada", reachedAt: ["completed"] },
];

export function OrderProgress({ status }: { status: TransactionStatus }) {
  return (
    <ol
      className="grid grid-cols-4 gap-1.5 text-xs"
      aria-label="Progreso de la orden"
    >
      {STEPS.map((step) => {
        const reached = step.reachedAt.includes(status);
        return (
          <li key={step.label} className="flex flex-col gap-1">
            <span
              className={`h-1.5 rounded-full ${reached ? "bg-brand" : "bg-border"}`}
            />
            <span className={reached ? "font-medium" : "text-muted"}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
