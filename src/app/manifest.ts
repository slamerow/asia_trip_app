import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fff4df",
    description: "Mobile itinerary for Eli and Tina's Asia sabbatical.",
    display: "standalone",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    name: "Asia Trip App",
    short_name: "Asia Trip",
    start_url: "/",
    theme_color: "#1f3f2d",
  };
}
