import { Logo } from "@/components/logo";
import { Network } from "@/components/network";

const POINTS = [
  "Empresas registradas con NIT",
  "Cotizaciones formales dentro del chat",
  "Transporte y seguimiento en un solo lugar",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-ink p-12 text-on-ink lg:flex lg:flex-col lg:justify-between">
        <Network className="absolute inset-0 -z-10 h-full w-full opacity-50" />
        <Logo className="text-on-ink" />
        <div className="max-w-md">
          <p className="eyebrow text-signal">Una red productiva</p>
          <h2 className="mt-4 text-4xl font-extrabold leading-[1.05]">
            Lo que a tu empresa le sobra, a otra le hace falta.
          </h2>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-on-ink-muted">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-signal" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-xs text-on-ink-muted">RexFy · Colombia</p>
      </aside>
      <main className="flex flex-col items-center justify-center gap-8 px-4 py-12">
        <Logo className="lg:hidden" />
        {children}
      </main>
    </div>
  );
}
