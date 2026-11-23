export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
};

export function cursorHref(
  pathname: string,
  cursor: string,
  key = "cursor",
): string {
  const params = new URLSearchParams({ [key]: cursor });
  return `${pathname}?${params.toString()}`;
}
