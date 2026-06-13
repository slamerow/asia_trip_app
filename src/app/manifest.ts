import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fff4df",
    description: "Follow Wren's adventure across Asia.",
    display: "standalone",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    name: "Wren's Adventure",
    short_name: "Wren's Adventure",
    start_url: "/",
    theme_color: "#1f3f2d",
  };
}
