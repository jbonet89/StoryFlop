import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Scrum Poker for Agile Teams. Reveal estimates and reach consensus.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F3EA",
    theme_color: "#FF645A",
    icons: [
      { src: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

