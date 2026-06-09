"use client";

import { useEffect } from "react";

export function OfflineSupport() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support should never interrupt the trip app itself.
    });
  }, []);

  return null;
}
