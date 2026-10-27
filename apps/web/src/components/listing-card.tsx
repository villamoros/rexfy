import Link from "next/link";

import {
  CATEGORIES,
  availabilityLabel,
  formatPrice,
  formatQuantity,
  type Listing,
} from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <li
      className="material card group relative overflow-hidden p-4 pl-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 sm:pl-6"
      data-category={listing.category}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 bg-[var(--cat)]"
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="material-badge">{CATEGORIES[listing.category]}</span>
          <h3 className="mt-2 text-lg font-semibold leading-snug">
            <Link
              href={`/publicaciones/${listing.id}`}
              className="after:absolute after:inset-0 group-hover:text-brand-strong"
            >
              {listing.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            {listing.company.legal_name}
            {listing.company.is_verified && (
              <span className="chip py-0 text-[0.6875rem]">✓ Verificada</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold tabular-nums">
            {formatPrice(listing)}
          </p>
          {listing.price_negotiable && (
            <p className="text-xs text-muted">Negociable</p>
          )}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        <Tag>
          {formatQuantity(listing.quantity, listing.quantity_unit)} disponibles
        </Tag>
        <Tag>{listing.city}</Tag>
        <Tag>{availabilityLabel(listing)}</Tag>
        {listing.is_recurring && <Tag>Oferta recurrente</Tag>}
        {listing.min_order_quantity !== null && (
          <Tag>
            Mínimo{" "}
            {formatQuantity(listing.min_order_quantity, listing.quantity_unit)}
          </Tag>
        )}
      </ul>
    </li>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-md bg-surface-sunken px-2 py-0.5 text-muted">
      {children}
    </li>
  );
}
