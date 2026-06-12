"use client";

import { useEffect } from "react";

export function OfflineSupport() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      caches.keys().then((cacheNames) => {
        cacheNames
          .filter((cacheName) => cacheName.startsWith("asia-trip-"))
          .forEach((cacheName) => caches.delete(cacheName));
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support should never interrupt the trip app itself.
    });
  }, []);

  return null;
}
