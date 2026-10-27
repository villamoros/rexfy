import { formatDateTime } from "@/lib/deals";
import { SHIPMENT_STATUS, type ShipmentEvent } from "@/lib/logistics";

export function ShipmentTimeline({ events }: { events: ShipmentEvent[] }) {
  return (
    <ol className="flex flex-col gap-3 border-l-2 border-border pl-4 text-sm">
      {[...events].reverse().map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
          <p className="font-medium">
            {event.status === "requested"
              ? "Transporte solicitado"
              : SHIPMENT_STATUS[event.status]}
          </p>
          {event.note && <p className="text-muted">{event.note}</p>}
          <p className="text-xs text-muted">
            {formatDateTime(event.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
