"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLoader } from "@/components/brand-loader";

export function ClerkGate({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const hasPendingContent = () => {
      if (document.querySelector('[data-rexfy-loading-boundary="true"]')) {
        return true;
      }
      const text = document.body.textContent?.toLowerCase() ?? "";
      return text.includes("cargando recursos") || text.includes("loading resources");
    };

    const waitForResources = async () => {
      if (document.readyState !== "complete") {
        await new Promise<void>((resolve) =>
          window.addEventListener("load", () => resolve(), { once: true }),
        );
      }
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images)
          .filter((image) => image.loading !== "lazy" && !image.complete)
          .map(
            (image) =>
              new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true });
                image.addEventListener("error", () => resolve(), { once: true });
              }),
          ),
      );
    };

    const scheduleReveal = () => {
      if (settleTimer) clearTimeout(settleTimer);
      if (hasPendingContent()) return;
      settleTimer = setTimeout(async () => {
        await waitForResources();
        if (cancelled || hasPendingContent()) return;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!cancelled) setReady(true);
          }),
        );
      }, 350);
    };

    const observer = new MutationObserver(scheduleReveal);
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    scheduleReveal();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [isLoaded]);

  return (
    <>
      <div
        className="app-reveal"
        aria-busy={!ready}
        inert={!ready}
      >
        {children}
      </div>
      <BrandLoader
        overlay
        hidden={ready}
        className={ready ? "brand-loader--leaving" : ""}
      />
    </>
  );
}
