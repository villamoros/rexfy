import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

import { ClientOnly } from "@/components/client-only";
import { Logo } from "@/components/logo";
import { NavLinks, NavList } from "@/components/nav-links";
import { VISITOR_LINKS, linksFor } from "@/lib/nav";
import { apiFetch } from "@/lib/api";
import { getMe, getToken } from "@/lib/session";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Logo />
        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <Suspense
            fallback={<NavList links={VISITOR_LINKS} pathname={null} />}
          >
            <RoleNav />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <Suspense fallback={null}>
            <Bell />
          </Suspense>
          <ClientOnly>
            <UserButton />
          </ClientOnly>
        </div>
      </nav>
    </header>
  );
}

/** Each user sees only the sections their companies' roles use. */
async function RoleNav() {
  return <NavLinks links={linksFor(await getMe())} />;
}

/** Link to the notifications, with how many are unread. */
async function Bell() {
  const me = await getMe();
  if (!me) return null;
  const count = await apiFetch<{ unread: number }>(
    "/notifications/unread-count",
    { token: await getToken() },
  );
  const unread = count.ok ? count.data.unread : 0;
  return (
    <Link
      href="/notificaciones"
      aria-label={
        unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"
      }
      className="relative grid size-9 place-items-center rounded-md text-muted hover:bg-surface-sunken hover:text-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-signal px-1 font-mono text-[10px] font-semibold leading-4 text-on-signal">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
