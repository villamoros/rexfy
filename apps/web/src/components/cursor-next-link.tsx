import Link from "next/link";

import { cursorHref } from "@/lib/pagination";

export function CursorNextLink({
  pathname,
  cursor,
  cursorKey,
  label = "Ver más",
}: {
  pathname: string;
  cursor: string | null;
  cursorKey?: string;
  label?: string;
}) {
  if (!cursor) return null;
  return (
    <Link
      href={cursorHref(pathname, cursor, cursorKey)}
      className="btn btn-secondary mt-4 w-fit"
      rel="next"
    >
      {label}
    </Link>
  );
}
