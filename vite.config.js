import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["apple-touch-icon.png"],
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
      manifest: {
        name: "LumaCare",
        short_name: "LumaCare",
        description:
          "Small steps. Better days. A private, local-first self-care and anti-procrastination companion.",
        theme_color: "#F5F4EE",
        background_color: "#F5F4EE",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: { target: "es2018" },
});
