import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.junhao319.gachadailycheckin",
  appName: "星迹手账",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
