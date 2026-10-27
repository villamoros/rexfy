import { UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

import { ClientOnly } from "@/components/client-only";
import { Logo } from "@/components/logo";
import { NavLinks, NavList } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Logo />
        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <Suspense fallback={<NavList pathname={null} />}>
            <NavLinks />
          </Suspense>
        </div>
        <div className="ml-auto sm:ml-0">
          <ClientOnly>
            <UserButton />
          </ClientOnly>
        </div>
      </nav>
    </header>
  );
}
