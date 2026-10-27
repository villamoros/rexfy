import { Logo } from "@/components/logo";

const POINTS = [
  "Empresas verificadas con NIT",
  "Cotizaciones formales dentro del chat",
  "Transporte y seguimiento en un solo lugar",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-on-ink lg:flex lg:flex-col lg:justify-between">
        <div className="dot-grid pointer-events-none absolute inset-0 text-lime opacity-40" />
        <Logo className="relative text-on-ink" />
        <div className="relative max-w-md">
          <p className="eyebrow text-lime">Economía circular B2B</p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.05]">
            Lo que a tu empresa le sobra, a otra le hace falta.
          </h2>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-on-ink/80">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-lime" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-xs text-on-ink/50">
          Hecho en Colombia · rexfy
        </p>
      </aside>
      <main className="flex flex-col items-center justify-center gap-8 px-4 py-12">
        <Logo className="lg:hidden" />
        {children}
      </main>
    </div>
  );
}
