"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackProductEvent } from "@/lib/analytics";

function inferLocaleFromPath(pathname: string) {
  return pathname.startsWith("/bn") ? "bn" : "en";
}

export function AnalyticsPageTracker() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    void trackProductEvent({
      eventName: "PAGE_VIEW",
      locale: inferLocaleFromPath(pathname),
      pagePath: pathname,
      referrerPath: previousPathRef.current ?? undefined,
    });

    previousPathRef.current = pathname;
  }, [pathname]);

  return null;
}
