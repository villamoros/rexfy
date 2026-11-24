import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Centro legal y de transparencia | RexFy",
  description:
    "Modelo de operación, materiales, pagos, privacidad y documentación legal de RexFy.",
};

const SECTIONS = [
  {
    id: "modelo",
    eyebrow: "Modelo de operación",
    title: "Una plataforma de conexión B2B",
    body: "RexFy está diseñando su operación como una plataforma tecnológica que facilita el contacto, la negociación y la trazabilidad entre empresas. La compraventa se celebra entre las partes, salvo que una operación identifique expresamente otra estructura jurídica antes de su aceptación.",
  },
  {
    id: "materiales",
    eyebrow: "Materiales y trazabilidad",
    title: "No todos los materiales siguen las mismas reglas",
    body: "La admisión depende del tipo, origen, estado, destino y riesgos del material. Los residuos peligrosos, RAEE, maderas, subproductos agroindustriales y otros materiales condicionados requieren controles y soportes específicos. Una publicación no sustituye licencias, permisos ni certificados aplicables.",
  },
  {
    id: "pagos",
    eyebrow: "Pagos y facturación",
    title: "Costos visibles antes de contratar",
    body: "El precio, la cantidad o peso aceptado, los ajustes de calidad, el transporte, la comisión, los impuestos y los costos del proveedor de pago deberán mostrarse de forma separada antes del cierre. El flujo definitivo de recaudo y facturación permanece sujeto a validación tributaria y contractual.",
  },
  {
    id: "privacidad",
    eyebrow: "Privacidad",
    title: "Datos empresariales con personas detrás",
    body: "Aunque la plataforma sea B2B, los datos de representantes, contactos y usuarios pueden ser datos personales. RexFy prepara avisos, autorizaciones, canales de consulta y reclamo, reglas de conservación y contratos con proveedores antes del lanzamiento comercial.",
  },
  {
    id: "reclamaciones",
    eyebrow: "Reclamaciones y controversias",
    title: "Una ruta gradual y trazable",
    body: "La arquitectura propuesta prioriza negociación directa, soporte de plataforma, conciliación y, cuando resulte proporcional y haya pacto válido, arbitraje o jurisdicción competente. Los canales formales y sus tiempos se publicarán con la identificación definitiva del operador.",
  },
];

export default function LegalPage() {
  return (
    <main className="flex-1 bg-surface-sunken">
      <section className="border-b border-border bg-ink text-on-ink">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Logo className="text-on-ink" />
          <p className="eyebrow mt-10 text-signal">Transparencia desde el diseño</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold sm:text-6xl">
            Centro legal y de transparencia
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-on-ink-muted">
            Estamos convirtiendo las reglas comerciales, tributarias,
            ambientales y de datos en controles verificables dentro del
            producto. Esta página muestra el estado del diseño; no reemplaza
            los documentos contractuales que deberán aceptarse en cada flujo.
          </p>
          <div className="mt-8 inline-flex rounded-full border border-signal/30 bg-signal/10 px-4 py-2 font-mono text-xs text-signal">
            ETAPA 1 · Auditoría inicial en revisión profesional
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Contenido legal" className="lg:sticky lg:top-6 lg:self-start">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted">
            En esta página
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <Link className="text-muted hover:text-foreground" href={`#${section.id}`}>
                  {section.eyebrow}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-muted hover:text-foreground" href="#documentos">
                Documentos
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section id={section.id} key={section.id} className="card scroll-mt-6 p-6 sm:p-8">
              <p className="eyebrow">{section.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{section.title}</h2>
              <p className="mt-4 leading-7 text-muted">{section.body}</p>
            </section>
          ))}

          <section id="documentos" className="card scroll-mt-6 border-brand/20 p-6 sm:p-8">
            <p className="eyebrow">Arquitectura documental</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Documentos en preparación
            </h2>
            <p className="mt-4 leading-7 text-muted">
              Términos B2B, reglas del marketplace, política de privacidad,
              anexo de materiales, reglas de pagos y facturación, logística,
              pesaje, debida diligencia, reclamaciones y trazabilidad de
              aceptaciones. Ningún borrador se presenta todavía como texto
              definitivo ni como asesoría legal.
            </p>
            <div className="mt-6 rounded-lg bg-surface-sunken p-4 text-sm leading-6 text-muted">
              La razón social, NIT, domicilio, canales formales y responsable
              de privacidad del operador están pendientes de confirmación y
              deberán publicarse antes de habilitar contratación comercial.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
