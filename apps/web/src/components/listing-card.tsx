import Link from "next/link";

import { MaterialIcon } from "@/components/icons";
import {
  CATEGORIES,
  availabilityLabel,
  formatPrice,
  formatQuantity,
  type Listing,
} from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <li className="card group relative flex gap-4 p-4 transition hover:border-foreground sm:p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface-sunken">
        <MaterialIcon category={listing.category} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-muted">
              {CATEGORIES[listing.category]}
            </span>
            <h3 className="text-lg font-bold leading-snug">
              <Link
                href={`/publicaciones/${listing.id}`}
                className="after:absolute after:inset-0"
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
            <p className="font-mono text-lg font-medium tabular-nums">
              {formatPrice(listing)}
            </p>
            {listing.price_negotiable && (
              <p className="text-xs text-muted">Negociable</p>
            )}
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          <Tag>
            {formatQuantity(listing.quantity, listing.quantity_unit)}{" "}
            disponibles
          </Tag>
          <Tag>{listing.city}</Tag>
          <Tag>{availabilityLabel(listing)}</Tag>
          {listing.is_recurring && <Tag>Oferta recurrente</Tag>}
          {listing.min_order_quantity !== null && (
            <Tag>
              Mínimo{" "}
              {formatQuantity(
                listing.min_order_quantity,
                listing.quantity_unit,
              )}
            </Tag>
          )}
        </ul>
      </div>
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
