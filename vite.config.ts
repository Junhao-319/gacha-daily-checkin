import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/gacha-daily-checkin/",
  plugins: [
    react(),
    VitePWA({
      disable: process.env.VITE_DISABLE_PWA === "true",
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "次元日常",
        short_name: "次元日常",
        description: "简洁的二游日常任务打卡工具。",
        lang: "zh-CN",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#0ea5e9",
        background_color: "#f4f7fb",
        categories: ["productivity", "lifestyle"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}"],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "index.html"
      }
    })
  ]
});