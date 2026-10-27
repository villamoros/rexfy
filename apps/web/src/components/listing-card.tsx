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
    <li className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">
            {CATEGORIES[listing.category]}
          </span>
          <h3 className="mt-1 font-medium">
            <Link
              href={`/publicaciones/${listing.id}`}
              className="hover:underline"
            >
              {listing.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {listing.company.legal_name}
            {listing.company.is_verified && " · Verificada"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatPrice(listing)}</p>
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
    <li className="rounded-full border border-border px-2.5 py-0.5 text-muted">
      {children}
    </li>
  );
}
