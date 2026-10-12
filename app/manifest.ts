import type { MetadataRoute } from "next";

// Lets the app be added to a tablet's home screen and open full-screen like a real app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alina's Play Time",
    short_name: "Play Time",
    description: "Learning games for Alina",
    start_url: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: "#bfe6ff",
    theme_color: "#bfe6ff",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
