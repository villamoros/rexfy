import type { MaterialCategory } from "@/lib/listings";

// Brand icon family (marca/iconos): 24px grid, 1.75 stroke, one Señal node per icon.
const ICONS = {
  "manufactura-metalmecanica": (
    <>
      <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="12" cy="12" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "manufactura-carpinteria": (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 11h5.5c1.6 0 2.4 2.5 4 2.5H21" />
      <path d="M14 6c0 1.5 1 2.5 2.5 2.5H21" />
      <circle cx="7.5" cy="14.8" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "manufactura-impresion-3d": (
    <>
      <path d="M9 3h6v3l-2 2.5h-2L9 6z" />
      <path d="M6 14.5h12M5 17.5h14M4 20.5h16" />
      <circle cx="12" cy="11.3" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "manufactura-confeccion": (
    <>
      <path d="M8.5 4L4 6.6l1.6 4 2-.8V20h8.8V9.8l2 .8 1.6-4L15.5 4c-.8 1.4-2 2.1-3.5 2.1S9.3 5.4 8.5 4z" />
      <circle cx="12" cy="11" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "manufactura-cnc": (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
      <circle cx="12" cy="12" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "manufactura-bordado": (
    <>
      <circle cx="10.5" cy="13.5" r="7" />
      <path d="M8 11l5 5M13 11l-5 5" />
      <path d="M15.5 8.5L21 3" />
      <circle cx="15.5" cy="8.5" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "manufactura-empaques": (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5L12 12l8-4.5M12 12v9" />
      <circle cx="12" cy="12" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "categoria-nueva": (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="M16.5 14v5M14 16.5h5" />
      <circle cx="16.5" cy="16.5" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-plastico": (
    <>
      <path d="M10 3h4v2.6c2 1 3 2.4 3 4.4v9.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5V10c0-2 1-3.4 3-4.4z" />
      <path d="M7 13h10" />
      <circle cx="12" cy="17" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-metal": (
    <>
      <path d="M3.5 15.5L7.5 9h13l-4 6.5z" />
      <path d="M3.5 15.5V19h13v-3.5M16.5 19l4-6.5V9" />
      <circle cx="12" cy="12.3" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-carton-papel": (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v5h5M9.5 16.5H15" />
      <circle cx="9.5" cy="12.5" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-madera": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-textil": (
    <>
      <path d="M6.5 4h11M6.5 20h11M8.5 4v16M15.5 4v16M8.5 8.5l7 3M8.5 12.5l7 3" />
      <circle cx="15.5" cy="11.5" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-vidrio": (
    <>
      <path d="M7 4h10l-1 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
      <path d="M7.4 9h9.2" />
      <circle cx="12" cy="15" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-electronico": (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
      <circle cx="12" cy="12" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
  "material-agroindustrial": (
    <>
      <path d="M5 19C5 10.5 10 5 19 5c0 8.5-5 14-14 14z" />
      <path d="M5 19l8-8" />
      <circle cx="13" cy="11" r="1.9" fill="var(--signal)" stroke="none" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

const MATERIAL_ICON: Record<MaterialCategory, IconName> = {
  plastic: "material-plastico",
  metal: "material-metal",
  paper_cardboard: "material-carton-papel",
  wood: "material-madera",
  textile: "material-textil",
  glass: "material-vidrio",
  electronic: "material-electronico",
  agro: "material-agroindustrial",
};

export function MaterialIcon({
  category,
  className,
}: {
  category: MaterialCategory;
  className?: string;
}) {
  return <Icon name={MATERIAL_ICON[category]} className={className} />;
}
