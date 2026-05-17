import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const devBackendTarget = process.env.TRIP_PLAN_DEV_BACKEND ?? "http://127.0.0.1:8081";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  },
  server: {
    proxy: {
      "/api": devBackendTarget,
      "/actuator": devBackendTarget
    }
  }
});
