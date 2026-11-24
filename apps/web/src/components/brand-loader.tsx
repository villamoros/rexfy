import { LogoMark } from "@/components/logo";

export function BrandLoader({
  boundary = false,
  className = "",
  hidden = false,
  overlay = false,
}: {
  boundary?: boolean;
  className?: string;
  hidden?: boolean;
  overlay?: boolean;
}) {
  return (
    <div
      className={`brand-loader ${overlay ? "brand-loader--overlay" : ""} ${className}`}
      data-rexfy-loading-boundary={boundary ? "true" : undefined}
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      aria-hidden={hidden}
    >
      <div className="brand-loader__stage" aria-hidden="true">
        <span className="brand-loader__halo" />
        <span className="brand-loader__orbit brand-loader__orbit--outer">
          <i className="brand-loader__node brand-loader__node--one" />
          <i className="brand-loader__node brand-loader__node--two" />
        </span>
        <span className="brand-loader__orbit brand-loader__orbit--inner">
          <i className="brand-loader__node brand-loader__node--three" />
        </span>
        <span className="brand-loader__mark-shell">
          <LogoMark className="brand-loader__mark" />
        </span>
      </div>
    </div>
  );
}
