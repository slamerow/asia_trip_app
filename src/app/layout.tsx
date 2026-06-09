import type { Metadata } from "next";
import { OfflineSupport } from "@/components/offline-support";
import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Asia Trip",
  },
  title: "Asia Trip App",
  description: "Mobile itinerary for Eli and Tina's Asia sabbatical.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <OfflineSupport />
        {children}
      </body>
    </html>
  );
}
