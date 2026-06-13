import type { Metadata } from "next";
import { OfflineSupport } from "@/components/offline-support";
import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wren's Adventure",
  },
  applicationName: "Wren's Adventure",
  title: "Wren's Adventure",
  description: "Follow Wren's adventure across Asia.",
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
